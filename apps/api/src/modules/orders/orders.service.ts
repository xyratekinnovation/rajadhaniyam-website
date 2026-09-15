import { prisma, type OrderStatus as PrismaOrderStatus } from "@rajadhaniyam/database";
import {
  COD_SURCHARGE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  type CheckoutInput,
  type CheckoutResult,
  type Order,
  type RazorpayCheckoutPayload,
} from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";
import { cartService, type CartIdentity } from "../cart/cart.service";
import { couponsService } from "../coupons/coupons.service";
import { assertRazorpayConfigured, createRazorpayOrder } from "../payments/razorpay.client";

const include = {
  items: true,
  coupon: true,
};

type OrderRow = NonNullable<Awaited<ReturnType<typeof findOne>>>;

function findOne(where: { id: string } | { orderNumber: string }) {
  return prisma.order.findUnique({ where: where as { id: string }, include });
}

function toOrder(row: OrderRow): Order {
  const snapshot = row.shippingSnapshot as {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerId: row.userId ?? undefined,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.variantId,
      productName: item.productName,
      variantWeight: item.variantWeight,
      price: Number(item.price),
      qty: item.qty,
    })),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount),
    total: Number(row.total),
    status: row.status.toLowerCase() as Order["status"],
    paymentStatus: row.paymentStatus.toLowerCase() as Order["paymentStatus"],
    shippingAddress: {
      id: row.shippingAddressId ?? "",
      customerId: row.userId ?? "",
      fullName: snapshot.fullName,
      phone: snapshot.phone,
      line1: snapshot.line1,
      line2: snapshot.line2,
      city: snapshot.city,
      state: snapshot.state,
      postalCode: snapshot.postalCode,
      country: snapshot.country,
    },
    couponCode: row.coupon?.code,
    createdAt: row.createdAt.toISOString(),
  };
}

// Last 8 digits of epoch ms, which changes every millisecond — collisions
// would need two orders created in the same millisecond, not a real concern
// at this store's scale. Simpler than a retry-on-conflict loop.
export function generateOrderNumber(): string {
  return `RJD${Date.now().toString().slice(-8)}`;
}

// Pure and exported for unit testing (orders.service.test.ts) — COD_SURCHARGE
// is a cash-handling fee, not a delivery fee, so it applies even once the
// order clears the free-shipping threshold, unlike the base shipping charge.
// Online (Razorpay) methods do not include the COD surcharge.
export function calculateShipping(
  subtotal: number,
  paymentMethod: CheckoutInput["paymentMethod"] = "cod",
): number {
  const baseShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  return baseShipping + (paymentMethod === "cod" ? COD_SURCHARGE : 0);
}

export const ordersService = {
  // Called by checkoutRoutes. `identity` is the same guest-or-customer
  // CartIdentity the cart uses — checkout reads whatever cart that identity
  // currently owns, same as cartService.get would.
  createOrder: async (identity: CartIdentity, input: CheckoutInput): Promise<CheckoutResult> => {
    const isOnline = input.paymentMethod !== "cod";
    if (isOnline) {
      // Fail fast before touching cart/stock if Razorpay keys are missing.
      assertRazorpayConfigured();
    }

    const cart = await cartService.getRawForCheckout(identity);
    if (!cart) throw new HttpError(400, "Your cart is empty");

    const outOfStock = cart.items.find((item) => item.stock < item.qty);
    if (outOfStock) {
      throw new HttpError(
        409,
        `${outOfStock.productName} (${outOfStock.variantWeight}) doesn't have enough stock`,
      );
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = calculateShipping(subtotal, input.paymentMethod);

    // Re-validated here, never trusted from the client — a coupon preview
    // shown earlier in the checkout flow could be stale (deactivated,
    // expired, or the cart changed) by the time this actually submits.
    let discount = 0;
    let couponId: string | undefined;
    if (input.couponCode) {
      const result = await couponsService.validate(input.couponCode, subtotal);
      discount = result.discount;
      couponId = result.coupon.id;
    }

    const total = subtotal + shipping - discount;
    const orderNumber = generateOrderNumber();

    const shippingSnapshot = {
      fullName: input.contact.fullName,
      phone: input.contact.phone,
      line1: input.address.line1,
      line2: input.address.line2,
      city: input.address.city,
      state: input.address.state,
      postalCode: input.address.postalCode,
      country: input.address.country,
    };

    const row = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: "userId" in identity ? identity.userId : null,
          email: input.contact.email,
          shippingSnapshot,
          subtotal,
          shipping,
          discount,
          couponId,
          total,
          status: "PENDING",
          paymentStatus: "PENDING",
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              productName: item.productName,
              variantWeight: item.variantWeight,
              price: item.price,
              qty: item.qty,
            })),
          },
          payment: {
            create: {
              provider: isOnline ? "razorpay" : "cod",
              method: input.paymentMethod,
              amount: total,
              status: "PENDING",
            },
          },
        },
        include,
      });

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.qty } },
        });
        // Best-effort mirror — packages/database's Inventory table isn't the
        // active source of truth yet (ProductVariant.stock is, see
        // products.service.ts), that's Phase 10's reservation system. Kept
        // in sync anyway so the numbers don't quietly diverge until then.
        await tx.inventory.updateMany({
          where: { variantId: item.variantId },
          data: { quantity: { decrement: item.qty } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.cartId } });

      return order;
    });

    const order = toOrder(row);

    if (!isOnline) {
      return { order };
    }

    // Create Razorpay order after our DB row exists. On failure, cancel + restock
    // so inventory isn't left reserved for an unpayable order.
    try {
      const { keyId } = assertRazorpayConfigured();
      const rzpOrder = await createRazorpayOrder({
        amountInr: total,
        receipt: orderNumber,
        notes: { orderId: order.id, orderNumber },
      });

      await prisma.payment.update({
        where: { orderId: order.id },
        data: { providerPaymentId: rzpOrder.id },
      });

      const razorpay: RazorpayCheckoutPayload = {
        keyId,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "Rajadhaniyam",
        description: `Order ${orderNumber}`,
        prefill: {
          name: input.contact.fullName,
          email: input.contact.email,
          contact: input.contact.phone,
        },
        preferMethod: input.paymentMethod as "upi" | "card" | "netbanking",
      };

      return { order, razorpay };
    } catch (err) {
      await ordersService.markPaymentFailed(order.id);
      if (err instanceof HttpError) throw err;
      throw new HttpError(
        502,
        "Couldn't start online payment — please try again or use Cash on Delivery",
      );
    }
  },

  listForCustomer: async (userId: string): Promise<Order[]> => {
    const rows = await prisma.order.findMany({
      where: { userId },
      include,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toOrder);
  },

  getForCustomer: async (userId: string, id: string): Promise<Order | undefined> => {
    const row = await prisma.order.findUnique({ where: { id }, include });
    return row && row.userId === userId ? toOrder(row) : undefined;
  },

  // ---------- Admin ----------

  listAll: async (): Promise<Order[]> => {
    const rows = await prisma.order.findMany({ include, orderBy: { createdAt: "desc" } });
    return rows.map(toOrder);
  },

  // Unlike getForCustomer, no ownership check — an admin can look up any order.
  getById: async (id: string): Promise<Order | undefined> => {
    const row = await prisma.order.findUnique({ where: { id }, include });
    return row ? toOrder(row) : undefined;
  },

  // Releases stock (Phase 10) when an order moves INTO cancelled from
  // something else — guarded so re-saving an already-cancelled order (or
  // any other transition) can't release the same stock twice.
  updateStatus: async (id: string, status: Order["status"]): Promise<Order> => {
    const newStatus = status.toUpperCase() as PrismaOrderStatus;

    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });

      if (newStatus === "CANCELLED" && existing.status !== "CANCELLED") {
        for (const item of existing.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.qty } },
          });
          await tx.inventory.updateMany({
            where: { variantId: item.variantId },
            data: { quantity: { increment: item.qty } },
          });
        }
      }

      return tx.order.update({ where: { id }, data: { status: newStatus }, include });
    });

    return toOrder(row);
  },

  /** Mark order paid after verified Razorpay payment (idempotent if already paid). */
  markPaymentPaid: async (orderId: string): Promise<Order> => {
    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { ...include, payment: true },
      });

      if (existing.paymentStatus === "PAID") {
        return tx.order.findUniqueOrThrow({ where: { id: orderId }, include });
      }

      if (existing.status === "CANCELLED") {
        throw new HttpError(409, "This order was cancelled and can't be marked paid");
      }

      await tx.payment.update({
        where: { orderId },
        data: { status: "PAID" },
      });

      return tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED" },
        include,
      });
    });

    return toOrder(row);
  },

  /**
   * Mark payment failed, cancel the order, and restore stock.
   * Idempotent if already cancelled / failed.
   */
  markPaymentFailed: async (orderId: string): Promise<Order> => {
    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true, payment: true },
      });

      if (existing.paymentStatus === "PAID") {
        throw new HttpError(409, "This order is already paid");
      }

      if (existing.payment) {
        await tx.payment.update({
          where: { orderId },
          data: { status: "FAILED" },
        });
      }

      if (existing.status !== "CANCELLED") {
        for (const item of existing.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.qty } },
          });
          await tx.inventory.updateMany({
            where: { variantId: item.variantId },
            data: { quantity: { increment: item.qty } },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
        include,
      });
    });

    return toOrder(row);
  },

  /** Look up our order by the Razorpay order id stored on Payment.providerPaymentId. */
  findByRazorpayOrderId: async (razorpayOrderId: string): Promise<Order | undefined> => {
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: razorpayOrderId, provider: "razorpay" },
      include: { order: { include } },
    });
    return payment?.order ? toOrder(payment.order as OrderRow) : undefined;
  },
};
