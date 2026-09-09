import type { Order } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

export const ordersApi = {
  list: () => apiGet<Order[]>("/orders"),
  getById: (id: string) => apiGet<Order>(`/orders/${id}`),
};
