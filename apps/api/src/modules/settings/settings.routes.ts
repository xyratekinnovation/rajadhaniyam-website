import { Hono } from "hono";
import { ok } from "../../utils/response";
import { settingsService } from "./settings.service";

// Public read — storefront cart/checkout preview. Writes are admin-only.
export const settingsRoutes = new Hono();

settingsRoutes.get("/shipping", async (c) => {
  return c.json(ok(await settingsService.getShipping()));
});
