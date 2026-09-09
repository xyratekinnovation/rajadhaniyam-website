import { Hono } from "hono";
import { z } from "zod";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { inventoryService } from "./inventory.service";

export const inventoryRoutes = new Hono();
inventoryRoutes.use("*", requireAdminAuth);

inventoryRoutes.get("/", async (c) => {
  return c.json(ok(await inventoryService.list()));
});

const setStockSchema = z.object({ stock: z.number().int() });

inventoryRoutes.patch("/:variantId", async (c) => {
  const parsed = setStockSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  return c.json(ok(await inventoryService.setStock(c.req.param("variantId")!, parsed.data.stock)));
});
