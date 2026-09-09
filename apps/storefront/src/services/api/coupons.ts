import type { Coupon } from "@rajadhaniyam/shared";
import { apiPost } from "./client";

export const couponsApi = {
  // A preview only — orders.service.ts re-validates independently at actual
  // checkout, since this result could be stale by the time the order submits.
  validate: (code: string, subtotal: number) =>
    apiPost<{ coupon: Coupon; discount: number }>("/coupons/validate", { code, subtotal }),
};
