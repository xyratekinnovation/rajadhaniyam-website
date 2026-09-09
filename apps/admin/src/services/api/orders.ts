import type { Order } from "@rajadhaniyam/shared";
import { apiGet, apiPatch } from "./client";

// client.ts prefixes every path with /admin, so these hit apps/api's
// /admin/orders routes (orders.admin.routes.ts).
export const ordersApi = {
  list: () => apiGet<Order[]>("/orders"),
  getById: (id: string) => apiGet<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: Order["status"]) =>
    apiPatch<Order>(`/orders/${id}/status`, { status }),
};
