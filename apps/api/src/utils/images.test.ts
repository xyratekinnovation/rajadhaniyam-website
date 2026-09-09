import { describe, expect, test } from "bun:test";
import { absoluteUrl } from "./images";
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
