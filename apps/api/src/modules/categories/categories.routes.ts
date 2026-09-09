import { Hono } from "hono";
import { ok, notImplemented } from "../../utils/response";
import { categoriesService } from "./categories.service";

export const categoriesRoutes = new Hono();

categoriesRoutes.get("/", async (c) => c.json(ok(await categoriesService.list())));

categoriesRoutes.get("/:slug", async (c) => {
  const category = await categoriesService.getBySlug(c.req.param("slug"));
  if (!category) return c.json({ success: false, message: "Category not found" }, 404);
  return c.json(ok(category));
});

categoriesRoutes.post("/", (c) => c.json(notImplemented("Category creation"), 501));
categoriesRoutes.patch("/:id", (c) => c.json(notImplemented("Category update"), 501));
categoriesRoutes.delete("/:id", (c) => c.json(notImplemented("Category deletion"), 501));
