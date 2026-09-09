import { prisma } from "@rajadhaniyam/database";
import type {
  Product,
  ProductAdminDetail,
  ProductInput,
  ProductNutritionFact,
} from "@rajadhaniyam/shared";
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
// admin) requests it. Seeded rows store relative paths (see prisma/seed.ts)
// because there's no real image hosting yet — this resolves those against the
// one app that currently serves them as static files. Admin-entered URLs may
// already be absolute (a real hosted image), so only relative paths get
// prefixed — otherwise this would mangle a real URL into garbage.
function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${env.STOREFRONT_URL}${path}`;
}

function variantSku(productSlug: string, weight: string): string {
  return `${productSlug}-${weight.replace(/\s+/g, "").toLowerCase()}`;
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

  // Public-facing: only ever returns a shopper-visible (ACTIVE) product.
  getById: async (slug: string): Promise<Product | undefined> => {
    const row = await findOne({ slug });
    return row && row.status === "ACTIVE" ? toProduct(row) : undefined;
  },

  // ---------- Admin (all statuses; keyed by slug, same identifier the
  // public API and DTO already use — there's no separate "admin id" to track) ----------

  listAdmin: async (): Promise<Product[]> => {
    const rows = await prisma.product.findMany({ include, orderBy: { createdAt: "desc" } });
    return rows.map(toProduct);
  },

  getBySlugAdmin: async (slug: string): Promise<ProductAdminDetail | undefined> => {
    const row = await findOne({ slug });
    if (!row) return undefined;
    return {
      ...toProduct(row),
      variantsDetail: row.variants.map((v) => ({
        weight: v.weight,
        price: Number(v.price),
        mrp: Number(v.mrp),
        stock: v.stock,
      })),
    };
  },

  create: async (input: ProductInput): Promise<Product> => {
    const row = await prisma.product.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        ingredients: input.ingredients,
        categoryId: input.categoryId,
        status: input.status.toUpperCase() as "DRAFT" | "ACTIVE" | "ARCHIVED",
        bestseller: input.bestseller,
        featured: input.featured,
        images: { create: input.images.map((url, position) => ({ url, position })) },
        variants: {
          create: input.variants.map((v) => ({
            sku: variantSku(input.slug, v.weight),
            weight: v.weight,
            price: v.price,
            mrp: v.mrp,
            stock: v.stock,
            inventory: { create: { quantity: v.stock } },
          })),
        },
      },
      include,
    });
    return toProduct(row);
  },

  // Replaces variants/images wholesale via nested deleteMany+create in one
  // query — the admin form always submits the full desired state (not a
  // diff), so this is simpler and equally correct. Variant ids/skus change
  // on every save; nothing external references them yet (cart/order line
  // items are Phase 6/7 work). `currentSlug` is the lookup key; `input.slug`
  // may rename it in the same call — Prisma allows a unique column to be
  // both the WHERE and part of the SET.
  update: async (currentSlug: string, input: ProductInput): Promise<Product> => {
    const row = await prisma.product.update({
      where: { slug: currentSlug },
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        ingredients: input.ingredients,
        categoryId: input.categoryId,
        status: input.status.toUpperCase() as "DRAFT" | "ACTIVE" | "ARCHIVED",
        bestseller: input.bestseller,
        featured: input.featured,
        images: {
          deleteMany: {},
          create: input.images.map((url, position) => ({ url, position })),
        },
        variants: {
          deleteMany: {},
          create: input.variants.map((v) => ({
            sku: variantSku(input.slug, v.weight),
            weight: v.weight,
            price: v.price,
            mrp: v.mrp,
            stock: v.stock,
            inventory: { create: { quantity: v.stock } },
          })),
        },
      },
      include,
    });
    return toProduct(row);
  },

  remove: async (slug: string): Promise<void> => {
    // ProductVariant/ProductImage/Review rows cascade via the schema's
    // onDelete: Cascade — see packages/database/prisma/schema.prisma.
    await prisma.product.delete({ where: { slug } });
  },
};
