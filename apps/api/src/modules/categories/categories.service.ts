import { prisma } from "@rajadhaniyam/database";
import type { Category, CategoryInput } from "@rajadhaniyam/shared";
import { env } from "../../config/env";
import { HttpError } from "../../middleware/errorHandler";

// See products.service.ts's absoluteUrl comment — same placeholder-hosting situation.
function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${env.STOREFRONT_URL}${path}`;
}

function toCategory(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
}): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: row.image ? absoluteUrl(row.image) : "",
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

  getById: async (id: string): Promise<Category | undefined> => {
    const row = await prisma.category.findUnique({ where: { id } });
    return row ? toCategory(row) : undefined;
  },

  create: async (input: CategoryInput): Promise<Category> => {
    const row = await prisma.category.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        image: input.image,
      },
    });
    return toCategory(row);
  },

  update: async (id: string, input: CategoryInput): Promise<Category> => {
    const row = await prisma.category.update({
      where: { id },
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        image: input.image,
      },
    });
    return toCategory(row);
  },

  // Products reference their category with a required, non-cascading FK
  // (categoryId String, no onDelete on that side) — deleting a category
  // that still has products would violate the FK constraint, so guard with
  // a clear error instead of a raw Prisma exception.
  remove: async (id: string): Promise<void> => {
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new HttpError(
        409,
        `Cannot delete category with ${productCount} product(s) still assigned to it`,
      );
    }
    await prisma.category.delete({ where: { id } });
  },
};
