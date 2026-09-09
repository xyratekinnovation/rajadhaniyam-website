import { Hono } from "hono";
import { z } from "zod";
import { addToCartSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { optionalAuth, type OptionalAuthEnv } from "../../middleware/auth";
import { cartService, type CartIdentity } from "./cart.service";

// Works for both guests and logged-in customers. A logged-in request's
// Authorization header takes precedence; guests are identified by a client-
// generated X-Cart-Session id (see apps/storefront/src/lib/cart.tsx) so the
// same guest cart survives across page loads without an account.
export const cartRoutes = new Hono<OptionalAuthEnv>();
cartRoutes.use("*", optionalAuth);

function resolveIdentity(c: import("hono").Context<OptionalAuthEnv>): CartIdentity {
  const customerAuth = c.get("customerAuth");
  if (customerAuth) return { userId: customerAuth.sub };

  const sessionId = c.req.header("x-cart-session");
  if (!sessionId) {
    throw new HttpError(400, "Missing X-Cart-Session header for a guest cart request");
  }
  return { sessionId };
}

cartRoutes.get("/", async (c) => {
  return c.json(ok(await cartService.get(resolveIdentity(c))));
});

cartRoutes.post("/items", async (c) => {
  const parsed = addToCartSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const { productId, weight, qty } = parsed.data;
  const cart = await cartService.addItem(resolveIdentity(c), productId, weight, qty);
  return c.json(ok(cart));
});

const updateItemSchema = z.object({ qty: z.number().int() });

cartRoutes.patch("/items/:itemId", async (c) => {
  const parsed = updateItemSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const cart = await cartService.updateItem(resolveIdentity(c), c.req.param("itemId"), parsed.data.qty);
  return c.json(ok(cart));
});

cartRoutes.delete("/items/:itemId", async (c) => {
  const cart = await cartService.removeItem(resolveIdentity(c), c.req.param("itemId"));
  return c.json(ok(cart));
});

cartRoutes.delete("/", async (c) => {
  await cartService.clear(resolveIdentity(c));
  return c.json(ok(null));
});
