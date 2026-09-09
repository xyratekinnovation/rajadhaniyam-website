import { describe, expect, test } from "bun:test";
import { signCustomerToken, signAdminToken, verifyToken } from "./jwt";

describe("customer tokens", () => {
  test("a signed customer token verifies back to the same subject", async () => {
    const token = await signCustomerToken("user-123");
    const payload = await verifyToken(token);
    expect(payload?.type).toBe("customer");
    expect(payload?.sub).toBe("user-123");
  });
});

describe("admin tokens", () => {
  test("a signed admin token verifies back to the same subject and role", async () => {
    const token = await signAdminToken("admin-456", "ADMIN");
    const payload = await verifyToken(token);
    expect(payload?.type).toBe("admin");
    expect(payload?.sub).toBe("admin-456");
    expect(payload && "role" in payload && payload.role).toBe("ADMIN");
  });
});

describe("verifyToken", () => {
  test("rejects a malformed token instead of throwing", async () => {
    expect(await verifyToken("not-a-real-jwt")).toBeUndefined();
  });

  test("rejects an empty string", async () => {
    expect(await verifyToken("")).toBeUndefined();
  });

  test("rejects a token signed with a different secret", async () => {
    // Same shape as a real token, but hono/jwt's verify checks the
    // signature against our configured secret, so a token signed
    // elsewhere (or hand-crafted) must fail even if well-formed.
    const bogus = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.invalidsignature";
    expect(await verifyToken(bogus)).toBeUndefined();
  });
});
