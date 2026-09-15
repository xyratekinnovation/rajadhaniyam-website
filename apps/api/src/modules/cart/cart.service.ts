import { prisma } from "@rajadhaniyam/database";
import { isShippingWaivedForProducts, type Cart } from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";
import { absoluteUrl } from "../../utils/images";
import { settingsService } from "../settings/settings.service";

export type CartIdentity = { userId: string } | { sessionId: string };

const include = {
  items: {
    include: {
      variant: {
        include: {
          product: { include: { images: { orderBy: { position: "asc" as const }, take: 1 } } },
        },
      },
    },
  },
};

type CartRow = NonNullable<Awaited<ReturnType<typeof findRow>>>;

function identityWhere(identity: CartIdentity) {
  return "userId" in identity ? { userId: identity.userId } : { sessionId: identity.sessionId };
}

function findRow(identity: CartIdentity) {
  return prisma.cart.findFirst({ where: identityWhere(identity), include });
}

async function getOrCreateRow(identity: CartIdentity): Promise<CartRow> {
  const existing = await findRow(identity);
  if (existing) return existing;
  return prisma.cart.create({ data: identityWhere(identity), include });
}

async function toCart(row: CartRow): Promise<Cart> {
  const items = row.items.map((item) => {
    const image = item.variant.product.images[0];
    return {
      id: item.id,
      productId: item.variant.product.slug,
      name: item.variant.product.name,
      image: image ? absoluteUrl(image.url) : "",
      weight: item.variant.weight,
      price: Number(item.variant.price),
      qty: item.qty,
    };
  });
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shippingSettings = await settingsService.getShipping();
  const shipping =
    subtotal === 0 ||
    subtotal >= shippingSettings.freeShippingThreshold ||
    isShippingWaivedForProducts(
      items.map((i) => i.name),
      shippingSettings.shippingWaivedProductName,
    )
      ? 0
      : shippingSettings.standardShippingFee;

  return { id: row.id, items, subtotal, shipping, total: subtotal + shipping };
}

async function resolveVariantId(productSlug: string, weight?: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });
  if (!product) throw new HttpError(404, "Product not found");

  // No weight given — fall back to the product's first (primary) variant,
  // matching how the storefront's own Product DTO picks a "default" weight
  // (see products.service.ts's toProduct).
  const variant = weight
    ? product.variants.find((v) => v.weight === weight)
    : product.variants[0];
  if (!variant) throw new HttpError(400, `No "${weight}" variant for this product`);

  return variant.id;
}

export const cartService = {
  get: async (identity: CartIdentity): Promise<Cart> => {
    const row = await findRow(identity);
    return row ? await toCart(row) : { items: [], subtotal: 0, shipping: 0, total: 0 };
  },

  addItem: async (
    identity: CartIdentity,
    productSlug: string,
    weight: string | undefined,
    qty: number,
  ): Promise<Cart> => {
    const variantId = await resolveVariantId(productSlug, weight);
    const cart = await getOrCreateRow(identity);

    const existing = cart.items.find((i) => i.variantId === variantId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + qty },
      });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, variantId, qty } });
    }

    return cartService.get(identity);
  },

  // qty <= 0 removes the line — matches the storefront's existing local-state
  // useCart().setQty behavior, so the sync layer doesn't change that contract.
  updateItem: async (identity: CartIdentity, itemId: string, qty: number): Promise<Cart> => {
    await assertOwnsItem(identity, itemId);
    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    }
    return cartService.get(identity);
  },

  removeItem: async (identity: CartIdentity, itemId: string): Promise<Cart> => {
    await assertOwnsItem(identity, itemId);
    await prisma.cartItem.delete({ where: { id: itemId } });
    return cartService.get(identity);
  },

  clear: async (identity: CartIdentity): Promise<void> => {
    const row = await findRow(identity);
    if (row) await prisma.cartItem.deleteMany({ where: { cartId: row.id } });
  },

  // Called from auth.service.ts on login. Sums quantities for variants
  // present in both carts, keeps the user's cart, and discards the guest
  // one — there's nothing worth preserving about a guest cart row once its
  // items have moved to a real account.
  mergeGuestCartIntoUser: async (sessionId: string, userId: string): Promise<void> => {
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await getOrCreateRow({ userId });

    await prisma.$transaction(
      guestCart.items.map((item) =>
        prisma.cartItem.upsert({
          where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
          create: { cartId: userCart.id, variantId: item.variantId, qty: item.qty },
          update: { qty: { increment: item.qty } },
        }),
      ),
    );

    await prisma.cart.delete({ where: { id: guestCart.id } });
  },

  // Internal — used by orders.service.ts's checkout flow, which needs
  // variantId/current stock that the public Cart DTO (toCart, above)
  // deliberately doesn't expose.
  getRawForCheckout: async (identity: CartIdentity) => {
    const row = await findRow(identity);
    if (!row || row.items.length === 0) return null;
    return {
      cartId: row.id,
      items: row.items.map((item) => ({
        variantId: item.variantId,
        productName: item.variant.product.name,
        variantWeight: item.variant.weight,
        price: Number(item.variant.price),
        qty: item.qty,
        stock: item.variant.stock,
      })),
    };
  },
};

async function assertOwnsItem(identity: CartIdentity, itemId: string): Promise<void> {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  const owns =
    item &&
    ("userId" in identity ? item.cart.userId === identity.userId : item.cart.sessionId === identity.sessionId);
  if (!owns) throw new HttpError(404, "Cart item not found");
}
