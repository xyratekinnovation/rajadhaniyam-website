import type { Order } from "@rajadhaniyam/shared";
import { apiPost } from "./client";

export const checkoutApi = {
  createOrder: (payload: {
    contact: { fullName: string; email: string; phone: string };
    address: { line1: string; line2?: string; city: string; state: string; postalCode: string };
    paymentMethod: "upi" | "card" | "netbanking" | "cod";
    couponCode?: string;
  }) => apiPost<Order>("/checkout", payload),
};
