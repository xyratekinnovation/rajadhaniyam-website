import { Hono } from "hono";
import { ok } from "../../utils/response";
import { categoriesService } from "./categories.service";

// Public, read-only — admin mutations live in categories.admin.routes.ts
// (mounted at /admin/categories) instead of here.
export const categoriesRoutes = new Hono();

categoriesRoutes.get("/", async (c) => c.json(ok(await categoriesService.list())));

categoriesRoutes.get("/:slug", async (c) => {
  const category = await categoriesService.getBySlug(c.req.param("slug"));
  if (!category) return c.json({ success: false, message: "Category not found" }, 404);
  return c.json(ok(category));
});
