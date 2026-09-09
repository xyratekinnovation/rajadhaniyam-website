import { Hono } from "hono";
import { paginated, ok, notImplemented } from "../../utils/response";
import { productsService } from "./products.service";

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

// Admin-only mutations — wired to requireAdminAuth once implemented (Phase 4).
productsRoutes.post("/", (c) => c.json(notImplemented("Product creation"), 501));
productsRoutes.patch("/:id", (c) => c.json(notImplemented("Product update"), 501));
productsRoutes.delete("/:id", (c) => c.json(notImplemented("Product deletion"), 501));
