import { describe, expect, test } from "bun:test";
import { app } from "./index";

// These exercise middleware/validation rejection paths that return before
// ever touching the database, so they're safe to run without Prisma
// connecting to the live Supabase instance.

describe("GET /health", () => {
  test("responds ok without auth", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { status: string } };
    expect(body.data.status).toBe("ok");
  });
});

describe("auth guards", () => {
  test("GET /orders without a bearer token is rejected before hitting the DB", async () => {
    const res = await app.request("/orders");
    expect(res.status).toBe(401);
  });

  test("GET /admin/orders without a bearer token is rejected before hitting the DB", async () => {
    const res = await app.request("/admin/orders");
    expect(res.status).toBe(401);
  });

  test("GET /admin/products without a bearer token is rejected before hitting the DB", async () => {
    const res = await app.request("/admin/products");
    expect(res.status).toBe(401);
  });

  test("a malformed bearer token is rejected the same as a missing one", async () => {
    const res = await app.request("/orders", {
      headers: { authorization: "Bearer not-a-real-jwt" },
    });
    expect(res.status).toBe(401);
  });
});

describe("checkout validation", () => {
  test("rejects a malformed checkout payload with 400 before touching the DB", async () => {
    const res = await app.request("/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentMethod: "bitcoin" }),
    });
    expect(res.status).toBe(400);
  });

  test("rejects a request with no body at all", async () => {
    const res = await app.request("/checkout", { method: "POST" });
    expect(res.status).toBe(400);
  });
});

describe("404 handling", () => {
  test("unknown routes return a JSON 404", async () => {
    const res = await app.request("/this-route-does-not-exist");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });
});
