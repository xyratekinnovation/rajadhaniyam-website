import type { Category } from "@rajadhaniyam/shared";
import { categories } from "@/lib/shop-data";
import { categoriesApi } from "@/services/api/categories";
import { ApiError } from "@/services/api/client";

export interface CategoryRepository {
  getAll(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | undefined>;
}

export class MockCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return categories;
  }

  async getBySlug(slug: string): Promise<Category | undefined> {
    return categories.find((c) => c.slug === slug);
  }
}

/** Backed by apps/api (Phase 3) instead of the hardcoded shop-data module. */
export class ApiCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return categoriesApi.list();
  }

  async getBySlug(slug: string): Promise<Category | undefined> {
    try {
      return await categoriesApi.getBySlug(slug);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  }
}
