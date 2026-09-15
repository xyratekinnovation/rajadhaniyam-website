import type { CheckoutInput, CheckoutResult, Order, PaymentVerifyInput } from "@rajadhaniyam/shared";
import { apiPost } from "./client";

export const checkoutApi = {
  createOrder: (payload: CheckoutInput) => apiPost<CheckoutResult>("/checkout", payload),
};

export const paymentsApi = {
  verify: (payload: PaymentVerifyInput) => apiPost<Order>("/payments/verify", payload),
};
