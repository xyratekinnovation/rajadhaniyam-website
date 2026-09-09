import { describe, expect, test } from "bun:test";
import type { Context } from "hono";
import { resolveCartIdentity } from "./cartIdentity";
import { HttpError } from "../middleware/errorHandler";
import type { OptionalAuthEnv } from "../middleware/auth";

// A minimal fake satisfying only what resolveCartIdentity actually calls —
// c.get("customerAuth") and c.req.header(...) — rather than a full Hono
// Context, which needs a real Request/Response cycle to construct.
function fakeContext(options: {
  customerAuth?: { sub: string };
  cartSessionHeader?: string;
}): Context<OptionalAuthEnv> {
  return {
    get: (key: string) => (key === "customerAuth" ? options.customerAuth : undefined),
    req: {
      header: (name: string) =>
        name === "x-cart-session" ? options.cartSessionHeader : undefined,
    },
  } as unknown as Context<OptionalAuthEnv>;
}

describe("resolveCartIdentity", () => {
  test("prefers the logged-in customer identity when present", () => {
    const identity = resolveCartIdentity(
      fakeContext({ customerAuth: { sub: "user-1" }, cartSessionHeader: "guest-session-xyz" }),
    );
    expect(identity).toEqual({ userId: "user-1" });
  });

  test("falls back to the guest session header when not logged in", () => {
    const identity = resolveCartIdentity(fakeContext({ cartSessionHeader: "guest-session-xyz" }));
    expect(identity).toEqual({ sessionId: "guest-session-xyz" });
  });

  test("throws a 400 HttpError when neither identity is available", () => {
    expect(() => resolveCartIdentity(fakeContext({}))).toThrow(HttpError);
    try {
      resolveCartIdentity(fakeContext({}));
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(400);
    }
  });
});
