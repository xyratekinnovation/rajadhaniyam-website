import { describe, expect, test } from "bun:test";
import { absoluteUrl, toStoredPath } from "./images";
import { env } from "../config/env";

describe("absoluteUrl", () => {
  test("prefixes a relative path with STOREFRONT_URL", () => {
    expect(absoluteUrl("/assets/p-kambu.jpg")).toBe(`${env.STOREFRONT_URL}/assets/p-kambu.jpg`);
  });

  test("passes through an already-absolute http URL unchanged", () => {
    const url = "http://example.com/image.jpg";
    expect(absoluteUrl(url)).toBe(url);
  });

  test("passes through an already-absolute https URL unchanged", () => {
    const url = "https://cdn.example.com/image.jpg";
    expect(absoluteUrl(url)).toBe(url);
  });
});

describe("toStoredPath", () => {
  test("unwraps a URL pointing at our own storefront back to relative", () => {
    expect(toStoredPath(`${env.STOREFRONT_URL}/assets/hero-grains.jpg`)).toBe(
      "/assets/hero-grains.jpg",
    );
  });

  test("round-trips through absoluteUrl back to the original relative path", () => {
    const original = "/assets/hero-grains.jpg";
    expect(toStoredPath(absoluteUrl(original))).toBe(original);
  });

  test("leaves an external/uploaded URL untouched", () => {
    const url = "https://cdn.supabase.co/storage/v1/object/public/product-images/abc.jpg";
    expect(toStoredPath(url)).toBe(url);
  });

  test("leaves an already-relative path untouched", () => {
    expect(toStoredPath("/assets/hero-grains.jpg")).toBe("/assets/hero-grains.jpg");
  });
});
