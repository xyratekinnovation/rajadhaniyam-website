import { Hono } from "hono";
import { couponInputSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { couponsService } from "./coupons.service";

// Mounted at /admin/coupons.
export const couponsAdminRoutes = new Hono();
couponsAdminRoutes.use("*", requireAdminAuth);

couponsAdminRoutes.get("/", async (c) => {
  return c.json(ok(await couponsService.list()));
});

couponsAdminRoutes.post("/", async (c) => {
  const parsed = couponInputSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await couponsService.create(parsed.data)), 201);
});

couponsAdminRoutes.patch("/:id", async (c) => {
  const parsed = couponInputSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await couponsService.update(c.req.param("id")!, parsed.data)));
});

couponsAdminRoutes.delete("/:id", async (c) => {
  await couponsService.remove(c.req.param("id")!);
  return c.json(ok(null));
});
