import type { Product } from "@rajadhaniyam/shared";
import { MockProductRepository, type ProductRepository } from "./productRepository";

/**
 * Swap this single line for an ApiProductRepository once apps/api exposes
 * real product endpoints — everything below (and every caller) stays the same.
 */
const repository: ProductRepository = new MockProductRepository();

export const productService = {
  getProducts: (): Promise<Product[]> => repository.getAll(),
  getProductById: (id: string): Promise<Product | undefined> => repository.getById(id),
  getProductsByCategory: (categorySlug: string): Promise<Product[]> =>
    repository.getByCategory(categorySlug),
  getBestsellers: (): Promise<Product[]> => repository.getBestsellers(),
  getRelatedProducts: (product: Product, limit?: number): Promise<Product[]> =>
    repository.getRelated(product, limit),
};
