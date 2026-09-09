import type { CheckoutInput, Order } from "@rajadhaniyam/shared";
import { apiPost } from "./client";

export const checkoutApi = {
  createOrder: (payload: CheckoutInput) => apiPost<Order>("/checkout", payload),
};
