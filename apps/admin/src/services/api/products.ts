import type { Product, ProductAdminDetail, ProductInput } from "@rajadhaniyam/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

// client.ts prefixes every path with /admin, so these hit apps/api's
// /admin/products routes (products.admin.routes.ts) — separate from the
// public /products the storefront reads.
export const productsApi = {
  list: () => apiGet<Product[]>("/products"),
  getBySlug: (slug: string) => apiGet<ProductAdminDetail>(`/products/${encodeURIComponent(slug)}`),
  create: (input: ProductInput) => apiPost<Product>("/products", input),
  update: (slug: string, input: ProductInput) =>
    apiPatch<Product>(`/products/${encodeURIComponent(slug)}`, input),
  remove: (slug: string) => apiDelete<null>(`/products/${encodeURIComponent(slug)}`),
};
