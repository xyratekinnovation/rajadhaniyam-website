import type { Category } from "@rajadhaniyam/shared";
import { categories } from "@/lib/shop-data";

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
