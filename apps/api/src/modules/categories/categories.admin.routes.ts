import { Hono } from "hono";
import { categoryInputSchema } from "@rajadhaniyam/shared";
import { ok, formatZodError } from "../../utils/response";
import { HttpError } from "../../middleware/errorHandler";
import { requireAdminAuth } from "../../middleware/auth";
import { categoriesService } from "./categories.service";

// Mounted at /admin/categories — see products.admin.routes.ts's comment on
// requireAdminAuth's current (foundation-only) auth guard.
export const categoriesAdminRoutes = new Hono();
categoriesAdminRoutes.use("*", requireAdminAuth);

categoriesAdminRoutes.get("/", async (c) => {
  return c.json(ok(await categoriesService.list()));
});

categoriesAdminRoutes.get("/:id", async (c) => {
  const category = await categoriesService.getById(c.req.param("id"));
  if (!category) return c.json({ success: false, message: "Category not found" }, 404);
  return c.json(ok(category));
});

categoriesAdminRoutes.post("/", async (c) => {
  const parsed = categoryInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const category = await categoriesService.create(parsed.data);
  return c.json(ok(category), 201);
});

categoriesAdminRoutes.patch("/:id", async (c) => {
  const parsed = categoryInputSchema.safeParse(await c.req.json());
  if (!parsed.success) throw new HttpError(400, formatZodError(parsed.error));
  const category = await categoriesService.update(c.req.param("id"), parsed.data);
  return c.json(ok(category));
});

categoriesAdminRoutes.delete("/:id", async (c) => {
  await categoriesService.remove(c.req.param("id"));
  return c.json(ok(null));
});
