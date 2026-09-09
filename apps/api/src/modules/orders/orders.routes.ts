import { Hono } from "hono";
import { z } from "zod";
import { checkoutSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAuth, requireAdminAuth, optionalAuth, type AuthEnv, type OptionalAuthEnv } from "../../middleware/auth";
import { resolveCartIdentity } from "../../utils/cartIdentity";
import { ordersService } from "./orders.service";

export const ordersRoutes = new Hono<AuthEnv>();
export const checkoutRoutes = new Hono<OptionalAuthEnv>();

// Customer order history
ordersRoutes.get("/", requireAuth, async (c) => {
  const { sub } = c.get("customerAuth");
  return c.json(ok(await ordersService.listForCustomer(sub)));
});

ordersRoutes.get("/:id", requireAuth, async (c) => {
  const { sub } = c.get("customerAuth");
  const order = await ordersService.getForCustomer(sub, c.req.param("id")!);
  if (!order) return c.json({ success: false, message: "Order not found" }, 404);
  return c.json(ok(order));
});

// Admin order management
ordersRoutes.get("/admin/all", requireAdminAuth, async (c) => {
  return c.json(ok(await ordersService.listAll()));
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
});

ordersRoutes.patch("/:id/status", requireAdminAuth, async (c) => {
  const parsed = updateStatusSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await ordersService.updateStatus(c.req.param("id")!, parsed.data.status)));
});

// Checkout — works for guests and logged-in customers, same identity
// resolution as the cart (see cart.routes.ts's resolveIdentity comment).
checkoutRoutes.use("*", optionalAuth);

checkoutRoutes.post("/", async (c) => {
  const parsed = checkoutSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));

  const order = await ordersService.createOrder(resolveCartIdentity(c), parsed.data);
  return c.json(ok(order), 201);
});
