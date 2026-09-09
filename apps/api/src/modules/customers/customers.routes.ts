import { Hono } from "hono";
import { ok, notImplemented } from "../../utils/response";
import { requireAdminAuth } from "../../middleware/auth";

export const customersRoutes = new Hono();

customersRoutes.get("/", requireAdminAuth, (c) => c.json(ok([])));
customersRoutes.get("/:id", requireAdminAuth, (c) =>
  c.json(notImplemented("Customer lookup"), 501),
);
customersRoutes.get("/:id/addresses", requireAdminAuth, (c) => c.json(ok([])));
customersRoutes.get("/:id/orders", requireAdminAuth, (c) => c.json(ok([])));
