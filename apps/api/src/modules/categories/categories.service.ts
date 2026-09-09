import { prisma } from "@rajadhaniyam/database";
import type { Category } from "@rajadhaniyam/shared";
import { env } from "../../config/env";

function toCategory(row: { id: string; slug: string; name: string; description: string | null; image: string | null }): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    // See products.service.ts's absoluteUrl comment — same placeholder-hosting situation.
    image: row.image ? `${env.STOREFRONT_URL}${row.image}` : "",
  };
}

export const categoriesService = {
  list: async (): Promise<Category[]> => {
    const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return rows.map(toCategory);
  },

  getBySlug: async (slug: string): Promise<Category | undefined> => {
    const row = await prisma.category.findUnique({ where: { slug } });
    return row ? toCategory(row) : undefined;
  },
};
