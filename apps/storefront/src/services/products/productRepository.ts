import type { Product } from "@rajadhaniyam/shared";
import { products, bestsellerIds } from "@/lib/shop-data";

export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  getByCategory(categorySlug: string): Promise<Product[]>;
  getBestsellers(): Promise<Product[]>;
  getRelated(product: Product, limit?: number): Promise<Product[]>;
}

/**
 * Reads from the hardcoded shop-data module. This is the ONLY place that
 * still touches the mock arrays directly — swap this for an
 * ApiProductRepository (fetching apps/api) once the backend is ready, and
 * nothing outside this file needs to change.
 */
export class MockProductRepository implements ProductRepository {
  async getAll(): Promise<Product[]> {
    return products;
  }

  async getById(id: string): Promise<Product | undefined> {
    return products.find((p) => p.id === id);
  }

  async getByCategory(categorySlug: string): Promise<Product[]> {
    return products.filter((p) => p.categorySlug === categorySlug);
  }

  async getBestsellers(): Promise<Product[]> {
    return bestsellerIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }

  async getRelated(product: Product, limit = 3): Promise<Product[]> {
    return products
      .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
      .slice(0, limit);
  }
}
