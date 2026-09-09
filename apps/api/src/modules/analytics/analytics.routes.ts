import { Hono } from "hono";
import { ok } from "../../utils/response";
import { requireAdminAuth } from "../../middleware/auth";
import { analyticsService } from "./analytics.service";

// Backs the admin dashboard's stat cards and recent-orders table.
export const analyticsRoutes = new Hono();

analyticsRoutes.get("/summary", requireAdminAuth, async (c) => {
  return c.json(ok(await analyticsService.getSummary()));
});
