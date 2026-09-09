import type { Customer } from "@rajadhaniyam/shared";
import { apiPost } from "./client";

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<{ customer: Customer; token: string }>("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    apiPost<{ customer: Customer; token: string }>("/auth/register", { name, email, password }),
  logout: () => apiPost<void>("/auth/logout"),
};
