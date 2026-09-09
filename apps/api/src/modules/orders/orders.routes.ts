import { Hono } from "hono";
import { checkoutSchema } from "@rajadhaniyam/shared";
import { ok, notImplemented } from "../../utils/response";
import { requireAuth, requireAdminAuth } from "../../middleware/auth";

export const ordersRoutes = new Hono();
export const checkoutRoutes = new Hono();

// Customer order history
ordersRoutes.get("/", requireAuth, (c) => c.json(ok([])));
ordersRoutes.get("/:id", requireAuth, (c) => c.json(notImplemented("Order lookup"), 501));

// Admin order management
ordersRoutes.get("/admin/all", requireAdminAuth, (c) => c.json(ok([])));
ordersRoutes.patch("/:id/status", requireAdminAuth, (c) =>
  c.json(notImplemented("Order status update"), 501),
);

// Checkout — creates the order (address, coupon, inventory check, payment
// intent). See docs/DEVELOPMENT_ROADMAP.md Phase 7–9.
checkoutRoutes.post("/", async (c) => {
  const parsed = checkoutSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, message: "Invalid payload" }, 400);
  return c.json(notImplemented("Checkout / order creation"), 501);
});
