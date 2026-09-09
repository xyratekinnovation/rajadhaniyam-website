import { prisma, type OrderStatus as PrismaOrderStatus } from "@rajadhaniyam/database";
import {
  COD_SURCHARGE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  type CheckoutInput,
  type Order,
} from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";
import { cartService, type CartIdentity } from "../cart/cart.service";

const include = {
  items: true,
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
    createdAt: row.createdAt.toISOString(),
  };
}

function generateOrderNumber(): string {
  // Last 8 digits of epoch ms, which changes every millisecond — collisions
  // would need two orders created in the same millisecond, not a real
  // concern at this store's scale. Simpler than a retry-on-conflict loop.
  return `RJD${Date.now().toString().slice(-8)}`;
}

export const ordersService = {
  // Called by checkoutRoutes. `identity` is the same guest-or-customer
  // CartIdentity the cart uses — checkout reads whatever cart that identity
  // currently owns, same as cartService.get would.
  createOrder: async (identity: CartIdentity, input: CheckoutInput): Promise<Order> => {
    if (input.couponCode) {
      throw new HttpError(400, "Coupons aren't available yet — remove the coupon code to continue");
    }
    // Razorpay isn't wired up yet (pending account approval) — Cash on
    // Delivery is the only payment method that can actually be fulfilled
    // right now. Reject the others clearly instead of creating an order
    // that can never be paid for online.
    if (input.paymentMethod !== "cod") {
      throw new HttpError(
        503,
        "Online payment isn't available yet — please choose Cash on Delivery for now",
      );
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
    // COD_SURCHARGE is a cash-handling fee, not a delivery fee — it applies
    // even when the order clears the free-shipping threshold, unlike the
    // base shipping charge.
    const baseShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const shipping = baseShipping + COD_SURCHARGE;
    const total = subtotal + shipping;

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
          orderNumber: generateOrderNumber(),
          userId: "userId" in identity ? identity.userId : null,
          email: input.contact.email,
          shippingSnapshot,
          subtotal,
          shipping,
          discount: 0,
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
            create: { provider: "cod", method: "cod", amount: total, status: "PENDING" },
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

    return toOrder(row);
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

  updateStatus: async (id: string, status: Order["status"]): Promise<Order> => {
    const row = await prisma.order.update({
      where: { id },
      data: { status: status.toUpperCase() as PrismaOrderStatus },
      include,
    });
    return toOrder(row);
  },
};
