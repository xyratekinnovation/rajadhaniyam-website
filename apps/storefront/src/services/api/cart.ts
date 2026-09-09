import type { Cart } from "@rajadhaniyam/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

// Backs src/lib/cart.tsx's server-sync layer (Phase 6) — local React state
// is still the source of truth for instant UI feedback; this is called
// best-effort in the background to keep the server cart eventually
// consistent. See lib/cart.tsx for how the two are reconciled.
export const cartApi = {
  get: () => apiGet<Cart>("/cart"),
  addItem: (productId: string, weight: string, qty: number) =>
    apiPost<Cart>("/cart/items", { productId, weight, qty }),
  updateItem: (itemId: string, qty: number) => apiPatch<Cart>(`/cart/items/${itemId}`, { qty }),
  removeItem: (itemId: string) => apiDelete<Cart>(`/cart/items/${itemId}`),
  clear: () => apiDelete<null>("/cart"),
};
