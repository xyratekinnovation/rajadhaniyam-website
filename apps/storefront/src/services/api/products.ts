import type { Product } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

export const productsApi = {
  list: () => apiGet<Product[]>("/products"),
  getById: (id: string) => apiGet<Product>(`/products/${id}`),
  getByCategory: (categorySlug: string) =>
    apiGet<Product[]>(`/products?category=${encodeURIComponent(categorySlug)}`),
  getBestsellers: () => apiGet<Product[]>("/products?bestseller=true"),
};
