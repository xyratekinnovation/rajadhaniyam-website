import { Hono } from "hono";
import { paginated, ok } from "../../utils/response";
import { productsService } from "./products.service";

// Public, read-only — admin mutations live in products.admin.routes.ts
// (mounted at /admin/products) instead of here.
export const productsRoutes = new Hono();

productsRoutes.get("/", async (c) => {
  const categorySlug = c.req.query("category");
  const bestseller = c.req.query("bestseller") === "true";
  const products = await productsService.list({ categorySlug, bestseller });
  return c.json(paginated(products));
});

productsRoutes.get("/:id", async (c) => {
  const product = await productsService.getById(c.req.param("id"));
  if (!product) return c.json({ success: false, message: "Product not found" }, 404);
  return c.json(ok(product));
});
