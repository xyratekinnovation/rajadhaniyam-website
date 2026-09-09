import { Hono } from "hono";
import { ok, notImplemented } from "../../utils/response";
import { requireAdminAuth } from "../../middleware/auth";

export const inventoryRoutes = new Hono();

inventoryRoutes.get("/", requireAdminAuth, (c) => c.json(ok([])));
inventoryRoutes.patch("/:variantId", requireAdminAuth, (c) =>
  c.json(notImplemented("Inventory adjustment"), 501),
);
