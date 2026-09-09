import type { Cart } from "@rajadhaniyam/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

// Prepared for the future server cart (guest + logged-in sync). The
// storefront's cart is still local React state via src/lib/cart.tsx.
export const cartApi = {
  get: () => apiGet<Cart>("/cart"),
  addItem: (productId: string, weight: string, qty: number) =>
    apiPost<Cart>("/cart/items", { productId, weight, qty }),
  updateItem: (itemId: string, qty: number) => apiPatch<Cart>(`/cart/items/${itemId}`, { qty }),
  removeItem: (itemId: string) => apiDelete<Cart>(`/cart/items/${itemId}`),
};
