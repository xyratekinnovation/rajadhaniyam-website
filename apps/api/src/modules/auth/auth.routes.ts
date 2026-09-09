import { Hono } from "hono";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@rajadhaniyam/shared";
import { notImplemented } from "../../utils/response";

// Foundation only — see docs/DEVELOPMENT_ROADMAP.md Phase 5 for the real
// customer + admin authentication implementation (JWT/session issuance,
// password hashing, AdminUser role checks).
export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, message: "Invalid payload" }, 400);
  return c.json(notImplemented("Customer registration"), 501);
});

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, message: "Invalid payload" }, 400);
  return c.json(notImplemented("Customer login"), 501);
});

authRoutes.post("/logout", (c) => c.json(notImplemented("Logout"), 501));

authRoutes.post("/forgot-password", async (c) => {
  const parsed = forgotPasswordSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ success: false, message: "Invalid payload" }, 400);
  return c.json(notImplemented("Forgot password"), 501);
});

authRoutes.post("/reset-password", (c) => c.json(notImplemented("Reset password"), 501));
authRoutes.get("/me", (c) => c.json(notImplemented("Current user lookup"), 501));

// Admin authentication is a separate credential set (AdminUser table), not
// a role flag on the customer User model.
authRoutes.post("/admin/login", (c) => c.json(notImplemented("Admin login"), 501));
