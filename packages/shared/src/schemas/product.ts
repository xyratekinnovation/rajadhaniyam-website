import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  name: z.string().min(1),
  category: z.string(),
  categorySlug: z.string(),
  categoryId: z.string().optional(),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  weight: z.string(),
  weights: z.array(z.string()).min(1),
  image: z.string(),
  images: z.array(z.string()).optional(),
  bestseller: z.boolean().optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  inStock: z.boolean(),
  rating: z.number().min(0).max(5),
  reviews: z.number().nonnegative(),
  description: z.string(),
  ingredients: z.string(),
  nutrition: z.array(z.object({ label: z.string(), value: z.string() })),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  image: z.string(),
});

export const productVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string(),
  weight: z.string(),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  active: z.boolean(),
});
