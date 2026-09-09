import type { Context, Next } from "hono";
import { HttpError } from "./errorHandler";
import { verifyToken, type AdminTokenPayload, type CustomerTokenPayload } from "../utils/jwt";

export type AuthVariables = {
  customerAuth: CustomerTokenPayload;
  adminAuth: AdminTokenPayload;
};

// Route files that read c.get("customerAuth")/c.get("adminAuth") should type
// their Hono instance as `new Hono<AuthEnv>()` so those reads type-check.
export type AuthEnv = { Variables: AuthVariables };

function bearerToken(c: Context): string | undefined {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

/** Verifies a real customer JWT and attaches its payload to context as `customerAuth`. */
export async function requireAuth(c: Context<AuthEnv>, next: Next) {
  const token = bearerToken(c);
  if (!token) throw new HttpError(401, "Authentication required");

  const payload = await verifyToken(token);
  if (!payload || payload.type !== "customer") {
    throw new HttpError(401, "Invalid or expired session");
  }

  c.set("customerAuth", payload);
  await next();
}

/** Verifies a real admin JWT and attaches its payload to context as `adminAuth`. */
export async function requireAdminAuth(c: Context<AuthEnv>, next: Next) {
  const token = bearerToken(c);
  if (!token) throw new HttpError(401, "Admin authentication required");

  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin") {
    throw new HttpError(401, "Invalid or expired admin session");
  }

  c.set("adminAuth", payload);
  await next();
}
