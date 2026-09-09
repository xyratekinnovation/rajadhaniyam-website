import { describe, expect, test } from "bun:test";
import { calculateShipping, generateOrderNumber } from "./orders.service";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, COD_SURCHARGE } from "@rajadhaniyam/shared";

describe("calculateShipping", () => {
  test("charges standard shipping + COD surcharge below the free-shipping threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD - 1)).toBe(
      STANDARD_SHIPPING_FEE + COD_SURCHARGE,
    );
  });

  test("waives the base shipping fee at exactly the free-shipping threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD)).toBe(COD_SURCHARGE);
  });

  test("waives the base shipping fee above the free-shipping threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD + 500)).toBe(COD_SURCHARGE);
  });

  // The COD surcharge is a cash-handling fee, not a delivery fee — it must
  // never be waived by the free-shipping threshold, only the base fee.
  test("COD surcharge always applies, even on free-shipping orders", () => {
    expect(calculateShipping(999999)).toBeGreaterThanOrEqual(COD_SURCHARGE);
  });

  test("zero subtotal still charges the surcharge and base fee", () => {
    expect(calculateShipping(0)).toBe(STANDARD_SHIPPING_FEE + COD_SURCHARGE);
  });
});

describe("generateOrderNumber", () => {
  test("starts with the RJD prefix", () => {
    expect(generateOrderNumber()).toMatch(/^RJD\d+$/);
  });

  test("is a stable length (prefix + 8 digits)", () => {
    expect(generateOrderNumber().length).toBe(11);
  });
});
