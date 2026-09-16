import type { Address, Customer, Order } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

// client.ts prefixes every path with /admin → /admin/customers…
export const customersApi = {
  list: () => apiGet<Customer[]>("/customers"),
  getById: (id: string) => apiGet<Customer>(`/customers/${id}`),
  listAddresses: (id: string) => apiGet<Address[]>(`/customers/${id}/addresses`),
  listOrders: (id: string) => apiGet<Order[]>(`/customers/${id}/orders`),
};
