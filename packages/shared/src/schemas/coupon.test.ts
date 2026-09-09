import { describe, expect, test } from "bun:test";
import { couponInputSchema } from "./coupon";

describe("couponInputSchema", () => {
  test("accepts a valid percentage coupon", () => {
    const result = couponInputSchema.safeParse({
      code: "welcome10",
      type: "percentage",
      value: 10,
      active: true,
    });
    expect(result.success).toBe(true);
  });

  test("normalizes the code to uppercase and trims it", () => {
    const result = couponInputSchema.safeParse({
      code: "  welcome10  ",
      type: "flat",
      value: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("WELCOME10");
  });

  test("rejects a percentage discount over 100", () => {
    const result = couponInputSchema.safeParse({
      code: "TOO-BIG",
      type: "percentage",
      value: 150,
    });
    expect(result.success).toBe(false);
  });

  test("allows a flat discount over 100 (no such cap for flat amounts)", () => {
    const result = couponInputSchema.safeParse({
      code: "BIG-FLAT",
      type: "flat",
      value: 500,
    });
    expect(result.success).toBe(true);
  });

  test("rejects a zero or negative value", () => {
    expect(
      couponInputSchema.safeParse({ code: "X", type: "flat", value: 0 }).success,
    ).toBe(false);
    expect(
      couponInputSchema.safeParse({ code: "X", type: "flat", value: -10 }).success,
    ).toBe(false);
  });

  test("rejects a missing code", () => {
    const result = couponInputSchema.safeParse({ type: "flat", value: 10 });
    expect(result.success).toBe(false);
  });

  test("defaults active to true when omitted", () => {
    const result = couponInputSchema.safeParse({ code: "X", type: "flat", value: 10 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });
});
