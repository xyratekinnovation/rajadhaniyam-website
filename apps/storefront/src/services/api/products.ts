import type { Product } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

// Not wired in yet — see services/products/productService.ts, which still
// reads from MockProductRepository. This mirrors the shape that an
// ApiProductRepository will call once apps/api exposes these routes.
export const productsApi = {
  list: () => apiGet<Product[]>("/products"),
  getById: (id: string) => apiGet<Product>(`/products/${id}`),
  getByCategory: (categorySlug: string) => apiGet<Product[]>(`/products?category=${categorySlug}`),
};
