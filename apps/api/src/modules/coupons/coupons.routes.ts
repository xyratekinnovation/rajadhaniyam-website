import { Hono } from "hono";
import { couponCodeSchema } from "@rajadhaniyam/shared";
import { ok, notImplemented } from "../../utils/response";
import { requireAdminAuth } from "../../middleware/auth";

export const couponsRoutes = new Hono();

couponsRoutes.post("/validate", async (c) => {
  const parsed = couponCodeSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, message: "Invalid payload" }, 400);
  return c.json(notImplemented("Coupon validation"), 501);
});

couponsRoutes.get("/", requireAdminAuth, (c) => c.json(ok([])));
couponsRoutes.post("/", requireAdminAuth, (c) => c.json(notImplemented("Coupon creation"), 501));
couponsRoutes.patch("/:id", requireAdminAuth, (c) => c.json(notImplemented("Coupon update"), 501));
couponsRoutes.delete("/:id", requireAdminAuth, (c) =>
  c.json(notImplemented("Coupon deletion"), 501),
);
