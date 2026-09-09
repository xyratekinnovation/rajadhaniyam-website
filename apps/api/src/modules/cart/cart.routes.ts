import { Hono } from "hono";
import { addToCartSchema } from "@rajadhaniyam/shared";
import { notImplemented } from "../../utils/response";

// The storefront cart is local React state today (src/lib/cart.tsx).
// These routes are prepared for Phase 6 (guest + logged-in cart sync).
export const cartRoutes = new Hono();

cartRoutes.get("/", (c) => c.json(notImplemented("Server cart lookup"), 501));

cartRoutes.post("/items", async (c) => {
  const parsed = addToCartSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, message: "Invalid payload" }, 400);
  return c.json(notImplemented("Add cart item"), 501);
});

cartRoutes.patch("/items/:itemId", (c) => c.json(notImplemented("Update cart item"), 501));
cartRoutes.delete("/items/:itemId", (c) => c.json(notImplemented("Remove cart item"), 501));
