import { sign, verify } from "hono/jwt";
import { env } from "../config/env";

// Discriminated by `type` so a customer token can never pass an admin route
// even if a role name were to collide — checked explicitly in middleware/auth.ts.
export type CustomerTokenPayload = {
  type: "customer";
  sub: string; // User.id
  exp: number;
};

export type AdminTokenPayload = {
  type: "admin";
  sub: string; // AdminUser.id
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  exp: number;
};

export type TokenPayload = CustomerTokenPayload | AdminTokenPayload;

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

function expiresAt(): number {
  return Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS;
}

export function signCustomerToken(userId: string): Promise<string> {
  const payload: CustomerTokenPayload = { type: "customer", sub: userId, exp: expiresAt() };
  return sign(payload, env.JWT_SECRET);
}

export function signAdminToken(
  adminId: string,
  role: AdminTokenPayload["role"],
): Promise<string> {
  const payload: AdminTokenPayload = { type: "admin", sub: adminId, role, exp: expiresAt() };
  return sign(payload, env.JWT_SECRET);
}

// Returns undefined on any failure (expired, malformed, wrong secret) rather
// than throwing — callers treat "no valid token" uniformly as unauthenticated.
export async function verifyToken(token: string): Promise<TokenPayload | undefined> {
  try {
    return (await verify(token, env.JWT_SECRET, "HS256")) as unknown as TokenPayload;
  } catch {
    return undefined;
  }
}
