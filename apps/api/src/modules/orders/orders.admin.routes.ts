import { Hono } from "hono";
import { z } from "zod";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { ordersService } from "./orders.service";

// Mounted at /admin/orders — see products.admin.routes.ts's comment on
// requireAdminAuth's current (foundation-only) auth guard, now closed by
// Phase 5's real JWT verification.
export const ordersAdminRoutes = new Hono();
ordersAdminRoutes.use("*", requireAdminAuth);

ordersAdminRoutes.get("/", async (c) => {
  return c.json(ok(await ordersService.listAll()));
});

ordersAdminRoutes.get("/:id", async (c) => {
  const order = await ordersService.getById(c.req.param("id")!);
  if (!order) return c.json({ success: false, message: "Order not found" }, 404);
  return c.json(ok(order));
});

const updateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
});

ordersAdminRoutes.patch("/:id/status", async (c) => {
  const parsed = updateStatusSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await ordersService.updateStatus(c.req.param("id")!, parsed.data.status)));
});
