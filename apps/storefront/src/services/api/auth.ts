import type { Address, Customer } from "@rajadhaniyam/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<{ customer: Customer; token: string }>("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    apiPost<{ customer: Customer; token: string }>("/auth/register", { name, email, password }),
  logout: () => apiPost<void>("/auth/logout"),
  me: () => apiGet<Customer>("/auth/me"),
  listAddresses: () => apiGet<Address[]>("/auth/addresses"),
  createAddress: (input: Omit<Address, "id" | "customerId">) =>
    apiPost<Address>("/auth/addresses", input),
  updateAddress: (id: string, input: Omit<Address, "id" | "customerId">) =>
    apiPatch<Address>(`/auth/addresses/${id}`, input),
  removeAddress: (id: string) => apiDelete<null>(`/auth/addresses/${id}`),
};
