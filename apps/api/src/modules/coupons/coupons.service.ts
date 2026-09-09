import { prisma } from "@rajadhaniyam/database";
import type { Coupon, CouponInput } from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";

function toCoupon(row: {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FLAT";
  value: unknown;
  minOrderValue: unknown;
  active: boolean;
  expiresAt: Date | null;
}): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? undefined,
    type: row.type === "PERCENTAGE" ? "percentage" : "flat",
    value: Number(row.value),
    minOrderValue: row.minOrderValue !== null ? Number(row.minOrderValue) : undefined,
    active: row.active,
    expiresAt: row.expiresAt?.toISOString(),
  };
}

function toPrismaType(type: "percentage" | "flat"): "PERCENTAGE" | "FLAT" {
  return type === "percentage" ? "PERCENTAGE" : "FLAT";
}

// Pure and exported so it's unit-testable without a database — see
// coupons.service.test.ts. Never discounts past the subtotal itself, and
// rounds to paise (2 decimal places) since a raw percentage-of-subtotal
// calculation can produce more.
export function calculateDiscount(
  type: "PERCENTAGE" | "FLAT",
  value: number,
  subtotal: number,
): number {
  const rawDiscount = type === "PERCENTAGE" ? (subtotal * value) / 100 : value;
  const discount = Math.min(rawDiscount, subtotal);
  return Math.round(discount * 100) / 100;
}

export const couponsService = {
  // Real validation, used both by the storefront's "Apply coupon" button
  // (a preview) and by orders.service.ts at actual checkout (the source of
  // truth — never trust a client-computed discount).
  validate: async (code: string, subtotal: number): Promise<{ coupon: Coupon; discount: number }> => {
    const row = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!row || !row.active) throw new HttpError(404, "Invalid coupon code");
    if (row.expiresAt && row.expiresAt < new Date()) {
      throw new HttpError(400, "This coupon has expired");
    }
    const minOrderValue = row.minOrderValue !== null ? Number(row.minOrderValue) : undefined;
    if (minOrderValue !== undefined && subtotal < minOrderValue) {
      throw new HttpError(400, `This coupon needs a minimum order of ₹${minOrderValue}`);
    }

    const discount = calculateDiscount(row.type, Number(row.value), subtotal);

    return { coupon: toCoupon(row), discount };
  },

  // ---------- Admin ----------

  list: async (): Promise<Coupon[]> => {
    const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toCoupon);
  },

  create: async (input: CouponInput): Promise<Coupon> => {
    const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
    if (existing) throw new HttpError(409, "A coupon with this code already exists");

    const row = await prisma.coupon.create({
      data: {
        code: input.code,
        description: input.description,
        type: toPrismaType(input.type),
        value: input.value,
        minOrderValue: input.minOrderValue,
        active: input.active,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });
    return toCoupon(row);
  },

  update: async (id: string, input: CouponInput): Promise<Coupon> => {
    const row = await prisma.coupon
      .update({
        where: { id },
        data: {
          code: input.code,
          description: input.description,
          type: toPrismaType(input.type),
          value: input.value,
          minOrderValue: input.minOrderValue ?? null,
          active: input.active,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      })
      .catch(() => {
        throw new HttpError(404, "Coupon not found");
      });
    return toCoupon(row);
  },

  remove: async (id: string): Promise<void> => {
    // Coupon.orders is a required-on-the-order-side optional relation
    // (Order.couponId is nullable), so deleting a coupon that's been used
    // wouldn't violate a constraint — but silently orphaning past orders'
    // discount attribution is still worth blocking, same as
    // categories.service.ts's product-count guard.
    const orderCount = await prisma.order.count({ where: { couponId: id } });
    if (orderCount > 0) {
      throw new HttpError(409, `Cannot delete a coupon used by ${orderCount} order(s)`);
    }
    await prisma.coupon.delete({ where: { id } }).catch(() => {
      throw new HttpError(404, "Coupon not found");
    });
  },
};
