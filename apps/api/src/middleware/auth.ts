import type { Context, Next } from "hono";
import { HttpError } from "./errorHandler";

/**
 * Foundation-only auth guards. They currently just check that an
 * Authorization header is present — real JWT/session verification against
 * @rajadhaniyam/database's User/AdminUser tables is Phase 5 work.
 */
export async function requireAuth(c: Context, next: Next) {
  const header = c.req.header("authorization");
  if (!header) throw new HttpError(401, "Authentication required");
  // TODO: verify JWT, load user, attach to context
  await next();
}

export async function requireAdminAuth(c: Context, next: Next) {
  const header = c.req.header("authorization");
  if (!header) throw new HttpError(401, "Admin authentication required");
  // TODO: verify JWT, check AdminUser role, attach to context
  await next();
}
