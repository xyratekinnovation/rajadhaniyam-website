import { Hono } from "hono";
import { couponCodeSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { couponsService } from "./coupons.service";

// Public — a shopper needs to validate a code before logging in or
// checking out. Admin CRUD lives in coupons.admin.routes.ts (/admin/coupons).
export const couponsRoutes = new Hono();

couponsRoutes.post("/validate", async (c) => {
  const parsed = couponCodeSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const result = await couponsService.validate(parsed.data.code, parsed.data.subtotal);
  return c.json(ok(result));
});
