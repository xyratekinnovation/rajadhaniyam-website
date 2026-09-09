import type { Context } from "hono";
import { HttpError } from "../middleware/errorHandler";
import type { OptionalAuthEnv } from "../middleware/auth";
import type { CartIdentity } from "../modules/cart/cart.service";

// Shared by cart.routes.ts and orders.routes.ts's checkout — both work for
// guests and logged-in customers off the same optionalAuth middleware.
export function resolveCartIdentity(c: Context<OptionalAuthEnv>): CartIdentity {
  const customerAuth = c.get("customerAuth");
  if (customerAuth) return { userId: customerAuth.sub };

  const sessionId = c.req.header("x-cart-session");
  if (!sessionId) {
    throw new HttpError(400, "Missing X-Cart-Session header for a guest request");
  }
  return { sessionId };
}
