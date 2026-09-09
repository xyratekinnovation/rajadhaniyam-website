import { describe, expect, test } from "bun:test";
import { calculateDiscount } from "./coupons.service";

describe("calculateDiscount", () => {
  test("percentage discount is a fraction of the subtotal", () => {
    expect(calculateDiscount("PERCENTAGE", 10, 200)).toBe(20);
  });

  test("flat discount is the flat value, independent of subtotal", () => {
    expect(calculateDiscount("FLAT", 50, 200)).toBe(50);
  });

  test("flat discount never exceeds the subtotal", () => {
    expect(calculateDiscount("FLAT", 500, 200)).toBe(200);
  });

  test("percentage discount never exceeds the subtotal (100%+ edge case)", () => {
    expect(calculateDiscount("PERCENTAGE", 100, 95)).toBe(95);
  });

  test("rounds to 2 decimal places", () => {
    // 15% of 95 = 14.25 exactly, but verifies the rounding path doesn't
    // introduce floating-point drift for a value that needs it.
    expect(calculateDiscount("PERCENTAGE", 15, 95)).toBe(14.25);
    expect(calculateDiscount("PERCENTAGE", 33, 100)).toBe(33);
    expect(calculateDiscount("PERCENTAGE", 33.333, 100)).toBe(33.33);
  });

  test("zero subtotal never produces a discount above zero", () => {
    expect(calculateDiscount("PERCENTAGE", 50, 0)).toBe(0);
    expect(calculateDiscount("FLAT", 50, 0)).toBe(0);
  });
});
