import type { Product } from "@rajadhaniyam/shared";
import { ApiProductRepository, type ProductRepository } from "./productRepository";

const repository: ProductRepository = new ApiProductRepository();

export const productService = {
  getProducts: (): Promise<Product[]> => repository.getAll(),
  getProductById: (id: string): Promise<Product | undefined> => repository.getById(id),
  getProductsByCategory: (categorySlug: string): Promise<Product[]> =>
    repository.getByCategory(categorySlug),
  getBestsellers: (): Promise<Product[]> => repository.getBestsellers(),
  getRelatedProducts: (product: Product, limit?: number): Promise<Product[]> =>
    repository.getRelated(product, limit),
};
