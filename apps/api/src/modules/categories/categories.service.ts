import type { Category } from "@rajadhaniyam/shared";

export const categoriesService = {
  list: async (): Promise<Category[]> => [],
  getBySlug: async (_slug: string): Promise<Category | undefined> => undefined,
};
