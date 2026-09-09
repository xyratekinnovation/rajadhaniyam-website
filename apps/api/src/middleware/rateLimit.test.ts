import { describe, expect, test } from "bun:test";
import type { Context } from "hono";
import { rateLimit } from "./rateLimit";
import { HttpError } from "./errorHandler";

// A minimal fake Context — the middleware only reads the x-forwarded-for
// header and calls c.header(...) on the 429 path, so that's all this stubs.
function fakeContext(ip: string): Context {
  return {
    req: { header: (name: string) => (name === "x-forwarded-for" ? ip : undefined) },
    header: () => {},
  } as unknown as Context;
}

async function noop() {}

describe("rateLimit", () => {
  test("allows requests under the limit", async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 3, name: "test-under" });
    const ctx = fakeContext("1.1.1.1");
    await limiter(ctx, noop);
    await limiter(ctx, noop);
    await limiter(ctx, noop);
    // No throw across 3 calls against a max of 3 — each call passing is the assertion.
    expect(true).toBe(true);
  });

  test("rejects once the limit is exceeded", async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2, name: "test-exceeded" });
    const ctx = fakeContext("2.2.2.2");
    await limiter(ctx, noop);
    await limiter(ctx, noop);
    await expect(limiter(ctx, noop)).rejects.toBeInstanceOf(HttpError);
  });

  test("tracks separate IPs independently", async () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, name: "test-per-ip" });
    await limiter(fakeContext("3.3.3.3"), noop);
    // A different IP under the same limiter/name should not be blocked by
    // the first IP's usage.
    await limiter(fakeContext("4.4.4.4"), noop);
  });

  test("resets after the window elapses", async () => {
    const limiter = rateLimit({ windowMs: 10, max: 1, name: "test-reset" });
    const ctx = fakeContext("5.5.5.5");
    await limiter(ctx, noop);
    await new Promise((resolve) => setTimeout(resolve, 20));
    // Window has passed, so this should be treated as a fresh bucket rather than rejected.
    await limiter(ctx, noop);
  });
});
