import { Hono } from "hono";
import { loginSchema, registerSchema, addressInputSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError, notImplemented } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAuth, type AuthEnv } from "../../middleware/auth";
import { authService } from "./auth.service";

export const authRoutes = new Hono<AuthEnv>();

authRoutes.post("/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const result = await authService.register(parsed.data);
  return c.json(ok(result), 201);
});

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const result = await authService.login(parsed.data);
  return c.json(ok(result));
});

// Stateless JWTs — nothing server-side to invalidate yet (no refresh-token/
// deny-list store). The client dropping its stored token is what actually
// "logs out"; this exists so the API surface is complete when that changes.
authRoutes.post("/logout", (c) => c.json(ok(null)));

authRoutes.post("/forgot-password", (c) => c.json(notImplemented("Forgot password"), 501));
authRoutes.post("/reset-password", (c) => c.json(notImplemented("Reset password"), 501));

authRoutes.get("/me", requireAuth, async (c) => {
  const { sub } = c.get("customerAuth");
  return c.json(ok(await authService.me(sub)));
});

authRoutes.get("/addresses", requireAuth, async (c) => {
  const { sub } = c.get("customerAuth");
  return c.json(ok(await authService.listAddresses(sub)));
});

authRoutes.post("/addresses", requireAuth, async (c) => {
  const parsed = addressInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const { sub } = c.get("customerAuth");
  return c.json(ok(await authService.createAddress(sub, parsed.data)), 201);
});

authRoutes.patch("/addresses/:id", requireAuth, async (c) => {
  const parsed = addressInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const { sub } = c.get("customerAuth");
  return c.json(ok(await authService.updateAddress(sub, c.req.param("id")!, parsed.data)));
});

authRoutes.delete("/addresses/:id", requireAuth, async (c) => {
  const { sub } = c.get("customerAuth");
  await authService.removeAddress(sub, c.req.param("id")!);
  return c.json(ok(null));
});

// Admin authentication is a separate credential set (AdminUser table), not
// a role flag on the customer User model.
authRoutes.post("/admin/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const result = await authService.adminLogin(parsed.data);
  return c.json(ok(result));
});
