import { describe, expect, test } from "bun:test";
import { calculateShipping, generateOrderNumber } from "./orders.service";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, COD_SURCHARGE } from "@rajadhaniyam/shared";

describe("calculateShipping", () => {
  test("charges standard shipping + COD surcharge below the free-shipping threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD - 1, "cod")).toBe(
      STANDARD_SHIPPING_FEE + COD_SURCHARGE,
    );
  });

  test("waives the base shipping fee at exactly the free-shipping threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD, "cod")).toBe(COD_SURCHARGE);
  });

  test("waives the base shipping fee above the free-shipping threshold", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD + 500, "cod")).toBe(COD_SURCHARGE);
  });

  // The COD surcharge is a cash-handling fee, not a delivery fee — it must
  // never be waived by the free-shipping threshold, only the base fee.
  test("COD surcharge always applies for COD, even on free-shipping orders", () => {
    expect(calculateShipping(999999, "cod")).toBeGreaterThanOrEqual(COD_SURCHARGE);
  });

  test("zero subtotal still charges the surcharge and base fee for COD", () => {
    expect(calculateShipping(0, "cod")).toBe(STANDARD_SHIPPING_FEE + COD_SURCHARGE);
  });

  test("online methods omit the COD surcharge", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD - 1, "upi")).toBe(STANDARD_SHIPPING_FEE);
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD, "card")).toBe(0);
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD + 100, "netbanking")).toBe(0);
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
