import type { Category } from "@rajadhaniyam/shared";
import { MockCategoryRepository, type CategoryRepository } from "./categoryRepository";

const repository: CategoryRepository = new MockCategoryRepository();

export const categoryService = {
  getCategories: (): Promise<Category[]> => repository.getAll(),
  getCategoryBySlug: (slug: string): Promise<Category | undefined> => repository.getBySlug(slug),
};
