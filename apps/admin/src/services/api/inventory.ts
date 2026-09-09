import type { InventoryItem } from "@rajadhaniyam/shared";
import { apiGet, apiPatch } from "./client";

export const inventoryApi = {
  list: () => apiGet<InventoryItem[]>("/inventory"),
  setStock: (variantId: string, stock: number) =>
    apiPatch<InventoryItem>(`/inventory/${variantId}`, { stock }),
};
