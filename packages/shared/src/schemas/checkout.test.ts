import { describe, expect, test } from "bun:test";
import { checkoutSchema, checkoutAddressSchema } from "./checkout";

const validCheckout = {
  contact: { fullName: "Test User", email: "test@example.com", phone: "9876543210" },
  address: {
    line1: "1 Test St",
    city: "Coimbatore",
    state: "Tamil Nadu",
    postalCode: "641001",
  },
  paymentMethod: "cod",
};

describe("checkoutSchema", () => {
  test("accepts a complete, valid checkout payload", () => {
    expect(checkoutSchema.safeParse(validCheckout).success).toBe(true);
  });

  test("rejects an invalid email", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      contact: { ...validCheckout.contact, email: "not-an-email" },
    });
    expect(result.success).toBe(false);
  });

  test("rejects a payment method outside the known set", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, paymentMethod: "bitcoin" });
    expect(result.success).toBe(false);
  });

  test("defaults country to India when omitted", () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.address.country).toBe("India");
  });

  test("couponCode is optional", () => {
    expect(checkoutSchema.safeParse(validCheckout).success).toBe(true);
    expect(
      checkoutSchema.safeParse({ ...validCheckout, couponCode: "SAVE10" }).success,
    ).toBe(true);
  });
});

describe("checkoutAddressSchema", () => {
  test("rejects a postal code shorter than 4 characters", () => {
    const result = checkoutAddressSchema.safeParse({
      line1: "1 Test St",
      city: "City",
      state: "State",
      postalCode: "12",
    });
    expect(result.success).toBe(false);
  });

  test("line2 is optional", () => {
    const result = checkoutAddressSchema.safeParse({
      line1: "1 Test St",
      city: "City",
      state: "State",
      postalCode: "641001",
    });
    expect(result.success).toBe(true);
  });
});
