import type { Product } from "@rajadhaniyam/shared";
import { products, bestsellerIds } from "@/lib/shop-data";
import { productsApi } from "@/services/api/products";
import { ApiError } from "@/services/api/client";

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

/** Backed by apps/api (Phase 3) instead of the hardcoded shop-data module. */
export class ApiProductRepository implements ProductRepository {
  async getAll(): Promise<Product[]> {
    return productsApi.list();
  }

  async getById(id: string): Promise<Product | undefined> {
    try {
      return await productsApi.getById(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  }

  async getByCategory(categorySlug: string): Promise<Product[]> {
    return productsApi.getByCategory(categorySlug);
  }

  async getBestsellers(): Promise<Product[]> {
    return productsApi.getBestsellers();
  }

  async getRelated(product: Product, limit = 3): Promise<Product[]> {
    const sameCategory = await productsApi.getByCategory(product.categorySlug);
    return sameCategory.filter((p) => p.id !== product.id).slice(0, limit);
  }
}
