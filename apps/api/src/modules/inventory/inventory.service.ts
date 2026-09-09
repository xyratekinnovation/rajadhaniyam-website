import { prisma } from "@rajadhaniyam/database";
import { LOW_STOCK_THRESHOLD, type InventoryItem } from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";

// Pure and exported for unit testing (inventory.service.test.ts).
export function isLowStock(stock: number): boolean {
  return stock <= LOW_STOCK_THRESHOLD;
}

export const inventoryService = {
  list: async (): Promise<InventoryItem[]> => {
    const variants = await prisma.productVariant.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: [{ stock: "asc" }, { createdAt: "asc" }],
    });

    return variants.map((v) => ({
      variantId: v.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      sku: v.sku,
      weight: v.weight,
      stock: v.stock,
      lowStock: isLowStock(v.stock),
    }));
  },

  // Sets the absolute stock count (not a delta) — simplest, least
  // surprising semantics for an admin typing a number into a field.
  setStock: async (variantId: string, stock: number): Promise<InventoryItem> => {
    if (stock < 0) throw new HttpError(400, "Stock can't be negative");

    const variant = await prisma.productVariant
      .update({
        where: { id: variantId },
        data: { stock },
        include: { product: { select: { name: true, slug: true } } },
      })
      .catch(() => {
        throw new HttpError(404, "Variant not found");
      });

    await prisma.inventory.updateMany({ where: { variantId }, data: { quantity: stock } });

    return {
      variantId: variant.id,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      sku: variant.sku,
      weight: variant.weight,
      stock: variant.stock,
      lowStock: isLowStock(variant.stock),
    };
  },
};
