import { describe, expect, test } from "bun:test";
import { LOW_STOCK_THRESHOLD } from "@rajadhaniyam/shared";
import { isLowStock } from "./inventory.service";

describe("isLowStock", () => {
  test("flags zero stock as low", () => {
    expect(isLowStock(0)).toBe(true);
  });

  test("flags stock at exactly the threshold as low (inclusive boundary)", () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD)).toBe(true);
  });

  test("does not flag stock one above the threshold", () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD + 1)).toBe(false);
  });

  test("does not flag plentiful stock", () => {
    expect(isLowStock(1000)).toBe(false);
  });
});
