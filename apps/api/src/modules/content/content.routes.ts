import { Hono } from "hono";
import { ok, notImplemented } from "../../utils/response";
import { contentService } from "./content.service";

// Public — homepage banners/hero and the contact form. Admin editing lives
// in content.admin.routes.ts (/admin/content, /admin/banners).
export const contentRoutes = new Hono();

contentRoutes.get("/banners", async (c) => {
  return c.json(ok(await contentService.listActiveBanners()));
});

contentRoutes.get("/hero", async (c) => {
  const hero = await contentService.getHero();
  // null (not a 404) — "no override saved" is an expected, normal state
  // the storefront falls back from, not an error.
  return c.json(ok(hero ?? null));
});

contentRoutes.post("/contact", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.message) {
    return c.json({ success: false, message: "email and message are required" }, 400);
  }
  return c.json(notImplemented("Contact enquiry submission"), 501);
});
