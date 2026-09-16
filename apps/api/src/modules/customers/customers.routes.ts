import { Hono } from "hono";
import { ok } from "../../utils/response";
import { requireAdminAuth } from "../../middleware/auth";
import { customersService } from "./customers.service";

// Mounted at /admin/customers — admin SPA client prefixes paths with /admin.
export const customersRoutes = new Hono();
customersRoutes.use("*", requireAdminAuth);

customersRoutes.get("/", async (c) => {
  return c.json(ok(await customersService.list()));
});

customersRoutes.get("/:id", async (c) => {
  const customer = await customersService.getById(c.req.param("id")!);
  if (!customer) return c.json({ success: false, message: "Customer not found" }, 404);
  return c.json(ok(customer));
});

customersRoutes.get("/:id/addresses", async (c) => {
  return c.json(ok(await customersService.listAddresses(c.req.param("id")!)));
});

customersRoutes.get("/:id/orders", async (c) => {
  return c.json(ok(await customersService.listOrders(c.req.param("id")!)));
});
