import type { Category, CategoryInput } from "@rajadhaniyam/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export const categoriesApi = {
  list: () => apiGet<Category[]>("/categories"),
  getById: (id: string) => apiGet<Category>(`/categories/${encodeURIComponent(id)}`),
  create: (input: CategoryInput) => apiPost<Category>("/categories", input),
  update: (id: string, input: CategoryInput) =>
    apiPatch<Category>(`/categories/${encodeURIComponent(id)}`, input),
  remove: (id: string) => apiDelete<null>(`/categories/${encodeURIComponent(id)}`),
};
