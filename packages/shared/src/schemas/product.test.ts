import { describe, expect, test } from "bun:test";
import { productInputSchema, categoryInputSchema } from "./product";

const validProduct = {
  name: "Kambu Broken",
  slug: "kambu-broken",
  categoryId: "cat-1",
  variants: [{ weight: "500 g", price: 95, mrp: 120, stock: 100 }],
};

describe("productInputSchema", () => {
  test("accepts a minimal valid product", () => {
    expect(productInputSchema.safeParse(validProduct).success).toBe(true);
  });

  test("requires at least one variant", () => {
    const result = productInputSchema.safeParse({ ...validProduct, variants: [] });
    expect(result.success).toBe(false);
  });

  test("rejects a slug with uppercase or spaces", () => {
    expect(productInputSchema.safeParse({ ...validProduct, slug: "Kambu Broken" }).success).toBe(
      false,
    );
    expect(productInputSchema.safeParse({ ...validProduct, slug: "kambu_broken" }).success).toBe(
      false,
    );
  });

  test("accepts a properly-hyphenated slug", () => {
    expect(
      productInputSchema.safeParse({ ...validProduct, slug: "family-pantry-combo" }).success,
    ).toBe(true);
  });

  test("rejects a status outside draft/active/archived", () => {
    const result = productInputSchema.safeParse({ ...validProduct, status: "published" });
    expect(result.success).toBe(false);
  });

  test("defaults status to draft when omitted", () => {
    const result = productInputSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("draft");
  });

  test("rejects a negative variant price", () => {
    const result = productInputSchema.safeParse({
      ...validProduct,
      variants: [{ weight: "500 g", price: -10, mrp: 120, stock: 100 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("categoryInputSchema", () => {
  test("accepts a valid category", () => {
    expect(
      categoryInputSchema.safeParse({ slug: "millet-grains", name: "Millet Grains" }).success,
    ).toBe(true);
  });

  test("rejects a slug with invalid characters", () => {
    expect(
      categoryInputSchema.safeParse({ slug: "Millet Grains!", name: "Millet Grains" }).success,
    ).toBe(false);
  });
});
