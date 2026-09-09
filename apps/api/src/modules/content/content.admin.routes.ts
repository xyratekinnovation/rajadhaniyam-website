import { Hono } from "hono";
import { bannerInputSchema, homepageHeroInputSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError, notImplemented } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { contentService } from "./content.service";

// Mounted at /admin/content.
export const contentAdminRoutes = new Hono();
contentAdminRoutes.use("*", requireAdminAuth);

contentAdminRoutes.get("/hero", async (c) => {
  return c.json(ok((await contentService.getHero()) ?? null));
});

contentAdminRoutes.patch("/hero", async (c) => {
  const parsed = homepageHeroInputSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await contentService.setHero(parsed.data)));
});

// Not implemented — no enquiry-management UI planned in this phase, kept as
// a stub for API-surface completeness (matches the pre-Phase-12 scaffold).
contentAdminRoutes.get("/contact", (c) => c.json(notImplemented("Contact enquiry list"), 501));

// Mounted at /admin/banners.
export const bannersAdminRoutes = new Hono();
bannersAdminRoutes.use("*", requireAdminAuth);

bannersAdminRoutes.get("/", async (c) => {
  return c.json(ok(await contentService.listAllBanners()));
});

bannersAdminRoutes.post("/", async (c) => {
  const parsed = bannerInputSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await contentService.createBanner(parsed.data)), 201);
});

bannersAdminRoutes.patch("/:id", async (c) => {
  const parsed = bannerInputSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await contentService.updateBanner(c.req.param("id")!, parsed.data)));
});

bannersAdminRoutes.delete("/:id", async (c) => {
  await contentService.removeBanner(c.req.param("id")!);
  return c.json(ok(null));
});
