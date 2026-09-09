import { Hono } from "hono";
import { ok } from "../../utils/response";
import { requireAdminAuth } from "../../middleware/auth";

// Backs the admin dashboard's stat cards. Placeholder zeros until orders/
// products/customers are real (Phase 13 — analytics).
export const analyticsRoutes = new Hono();

analyticsRoutes.get("/summary", requireAdminAuth, (c) =>
  c.json(
    ok({
      revenueLast30Days: 0,
      ordersLast30Days: 0,
      totalProducts: 0,
      totalCustomers: 0,
    }),
  ),
);
