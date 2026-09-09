import { prisma } from "@rajadhaniyam/database";
import type { Product, ProductNutritionFact } from "@rajadhaniyam/shared";
import { env } from "../../config/env";

const include = {
  category: true,
  // createdAt, not price — several seeded variants share a price, and Postgres
  // doesn't guarantee stable ordering among ties, which flips which weight
  // looks "primary" between requests. createdAt preserves seed insertion
  // order (see prisma/seed.ts's `weights` array order).
  variants: { orderBy: { createdAt: "asc" as const } },
  images: { orderBy: { position: "asc" as const } },
  reviews: { select: { rating: true } },
};

type ProductRow = NonNullable<Awaited<ReturnType<typeof findOne>>>;

function findOne(where: { slug: string }) {
  return prisma.product.findUnique({ where, include });
}

// Absolute so the response works the same regardless of which app (storefront,
// admin) requests it — stored paths are relative (see prisma/seed.ts) because
// there's no real image hosting yet (Phase 4); this just resolves them against
// the one app that currently serves them as static files.
function absoluteUrl(path: string): string {
  return `${env.STOREFRONT_URL}${path}`;
}

// The DTO's `id` is deliberately the human-readable slug, not the DB cuid —
// existing URLs (`/product/kambu-broken`) and cart/order references built on
// mock data's slug-shaped ids keep working unchanged.
function toProduct(row: ProductRow): Product {
  const variants = row.variants;
  const primary = variants[0];
  const rating = row.reviews.length
    ? row.reviews.reduce((sum, r) => sum + r.rating, 0) / row.reviews.length
    : 0;

  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    category: row.category.name,
    categorySlug: row.category.slug,
    categoryId: row.categoryId,
    price: primary ? Number(primary.price) : 0,
    mrp: primary ? Number(primary.mrp) : 0,
    weight: primary?.weight ?? "",
    weights: variants.map((v) => v.weight),
    image: row.images[0] ? absoluteUrl(row.images[0].url) : "",
    images: row.images.map((img) => absoluteUrl(img.url)),
    bestseller: row.bestseller,
    featured: row.featured,
    status: row.status.toLowerCase() as "draft" | "active" | "archived",
    inStock: variants.some((v) => v.stock > 0),
    rating: Math.round(rating * 10) / 10,
    reviews: row.reviews.length,
    description: row.description ?? "",
    ingredients: row.ingredients ?? "",
    nutrition: (row.nutritionFacts as ProductNutritionFact[] | null) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const productsService = {
  list: async (filters: { categorySlug?: string; bestseller?: boolean } = {}): Promise<Product[]> => {
    const rows = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
        ...(filters.bestseller ? { bestseller: true } : {}),
      },
      include,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProduct);
  },

  getById: async (slug: string): Promise<Product | undefined> => {
    const row = await findOne({ slug });
    return row ? toProduct(row) : undefined;
  },
};
