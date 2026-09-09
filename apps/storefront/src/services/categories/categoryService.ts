import type { Category } from "@rajadhaniyam/shared";
import { ApiCategoryRepository, type CategoryRepository } from "./categoryRepository";

const repository: CategoryRepository = new ApiCategoryRepository();

export const categoryService = {
  getCategories: (): Promise<Category[]> => repository.getAll(),
  getCategoryBySlug: (slug: string): Promise<Category | undefined> => repository.getBySlug(slug),
};
