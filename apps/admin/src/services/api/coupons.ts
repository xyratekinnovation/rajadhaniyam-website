import type { Coupon, CouponInput } from "@rajadhaniyam/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export const couponsApi = {
  list: () => apiGet<Coupon[]>("/coupons"),
  create: (input: CouponInput) => apiPost<Coupon>("/coupons", input),
  update: (id: string, input: CouponInput) => apiPatch<Coupon>(`/coupons/${id}`, input),
  remove: (id: string) => apiDelete<null>(`/coupons/${id}`),
};
