import { Hono } from "hono";
import { shippingSettingsSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { settingsService } from "./settings.service";

// Mounted at /admin/settings.
export const settingsAdminRoutes = new Hono();
settingsAdminRoutes.use("*", requireAdminAuth);

settingsAdminRoutes.get("/shipping", async (c) => {
  return c.json(ok(await settingsService.getShipping()));
});

settingsAdminRoutes.patch("/shipping", async (c) => {
  const parsed = shippingSettingsSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await settingsService.setShipping(parsed.data)));
});
