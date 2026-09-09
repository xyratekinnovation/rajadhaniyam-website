import type { Category } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

export const categoriesApi = {
  list: () => apiGet<Category[]>("/categories"),
  getBySlug: (slug: string) => apiGet<Category>(`/categories/${slug}`),
};
