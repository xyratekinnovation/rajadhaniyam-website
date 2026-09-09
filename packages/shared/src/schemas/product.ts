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

// ---------- Admin write-input schemas (apps/api /admin/*, apps/admin forms) ----------
// Shaped for creating/editing DB rows (categoryId + variants[]/images[]), unlike
// productSchema/categorySchema above which validate the storefront's flattened
// read DTO.

export const productVariantInputSchema = z.object({
  weight: z.string().min(1),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
});

export const productInputSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  bestseller: z.boolean().default(false),
  featured: z.boolean().default(false),
  images: z.array(z.string().min(1)).default([]),
  variants: z.array(productVariantInputSchema).min(1, "At least one weight/price variant is required"),
});

export const categoryInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
