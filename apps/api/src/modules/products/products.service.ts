import type { Product } from "@rajadhaniyam/shared";

/**
 * TODO(Phase 3): back this with @rajadhaniyam/database's Prisma client
 * (Product + ProductVariant + ProductImage tables) instead of an empty list.
 */
export const productsService = {
  list: async (): Promise<Product[]> => [],
  getById: async (_id: string): Promise<Product | undefined> => undefined,
};
