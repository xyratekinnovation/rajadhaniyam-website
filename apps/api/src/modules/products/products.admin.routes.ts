import { Hono } from "hono";
import { productInputSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { productsService } from "./products.service";

// Mounted at /admin/products. NOT YET protected by real auth — requireAdminAuth
// is still the foundation-only "header present" check (see middleware/auth.ts);
// real verification is Phase 5. Applying the guard now anyway so the wiring
// is in place and the gap is visible/auditable rather than silent.
export const productsAdminRoutes = new Hono();
productsAdminRoutes.use("*", requireAdminAuth);

productsAdminRoutes.get("/", async (c) => {
  return c.json(ok(await productsService.listAdmin()));
});

productsAdminRoutes.get("/:slug", async (c) => {
  const product = await productsService.getBySlugAdmin(c.req.param("slug"));
  if (!product) return c.json({ success: false, message: "Product not found" }, 404);
  return c.json(ok(product));
});

productsAdminRoutes.post("/", async (c) => {
  const parsed = productInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const product = await productsService.create(parsed.data);
  return c.json(ok(product), 201);
});

productsAdminRoutes.patch("/:slug", async (c) => {
  const parsed = productInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const product = await productsService.update(c.req.param("slug"), parsed.data);
  return c.json(ok(product));
});

productsAdminRoutes.delete("/:slug", async (c) => {
  await productsService.remove(c.req.param("slug"));
  return c.json(ok(null));
});
