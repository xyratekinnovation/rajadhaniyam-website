import type { Context, Next } from "hono";
import { prisma } from "@rajadhaniyam/database";
import { HttpError } from "./errorHandler";
import { verifyToken, type AdminTokenPayload, type CustomerTokenPayload } from "../utils/jwt";

export type AuthVariables = {
  customerAuth: CustomerTokenPayload;
  adminAuth: AdminTokenPayload;
};

// Route files that read c.get("customerAuth")/c.get("adminAuth") should type
// their Hono instance as `new Hono<AuthEnv>()` so those reads type-check.
export type AuthEnv = { Variables: AuthVariables };

// For routes that work for both guests and logged-in customers (the cart) —
// customerAuth may or may not be set, unlike AuthEnv where requireAuth
// guarantees it by the time a handler runs.
export type OptionalAuthEnv = { Variables: { customerAuth?: CustomerTokenPayload } };

function bearerToken(c: Context): string | undefined {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

// A JWT's signature staying valid doesn't mean the account it points to
// still exists — deleting a user (or, during development, wiping test
// accounts directly in the database) doesn't invalidate tokens already
// issued, since these are stateless and carry no server-side revocation
// list. Without this check, a stale token for a since-deleted user passes
// verification and then blows up downstream with a foreign-key violation
// the first time something tries to write a row referencing that user id
// (this is exactly how it surfaced: cart creation failing on
// carts_userId_fkey for a token whose user had been deleted).
async function customerExists(id: string): Promise<boolean> {
  return (await prisma.user.findUnique({ where: { id }, select: { id: true } })) !== null;
}

async function adminExists(id: string): Promise<boolean> {
  return (await prisma.adminUser.findUnique({ where: { id }, select: { id: true } })) !== null;
}

/** Verifies a real customer JWT and attaches its payload to context as `customerAuth`. */
export async function requireAuth(c: Context<AuthEnv>, next: Next) {
  const token = bearerToken(c);
  if (!token) throw new HttpError(401, "Authentication required");

  const payload = await verifyToken(token);
  if (!payload || payload.type !== "customer" || !(await customerExists(payload.sub))) {
    throw new HttpError(401, "Invalid or expired session");
  }

  c.set("customerAuth", payload);
  await next();
}

/**
 * Like requireAuth, but never rejects — for routes usable by both guests and
 * logged-in customers (the cart). Sets `customerAuth` when a valid customer
 * token is present, otherwise leaves it unset; callers fall back to a guest
 * identity (see cart.routes.ts's X-Cart-Session header).
 */
export async function optionalAuth(c: Context<OptionalAuthEnv>, next: Next) {
  const token = bearerToken(c);
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.type === "customer" && (await customerExists(payload.sub))) {
      c.set("customerAuth", payload);
    }
  }
  await next();
}

/** Verifies a real admin JWT and attaches its payload to context as `adminAuth`. */
export async function requireAdminAuth(c: Context<AuthEnv>, next: Next) {
  const token = bearerToken(c);
  if (!token) throw new HttpError(401, "Admin authentication required");

  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin" || !(await adminExists(payload.sub))) {
    throw new HttpError(401, "Invalid or expired admin session");
  }

  c.set("adminAuth", payload);
  await next();
}
