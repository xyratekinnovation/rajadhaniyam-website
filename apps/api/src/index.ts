import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { productsRoutes } from "./modules/products/products.routes";
import { productsAdminRoutes } from "./modules/products/products.admin.routes";
import { categoriesRoutes } from "./modules/categories/categories.routes";
import { categoriesAdminRoutes } from "./modules/categories/categories.admin.routes";
import { uploadsRoutes } from "./modules/uploads/uploads.routes";
import { customersRoutes } from "./modules/customers/customers.routes";
import { cartRoutes } from "./modules/cart/cart.routes";
import { ordersRoutes, checkoutRoutes } from "./modules/orders/orders.routes";
import { inventoryRoutes } from "./modules/inventory/inventory.routes";
import { paymentsRoutes } from "./modules/payments/payments.routes";
import { couponsRoutes } from "./modules/coupons/coupons.routes";
import { contentRoutes } from "./modules/content/content.routes";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [env.STOREFRONT_URL, env.ADMIN_URL],
    credentials: true,
  }),
);

app.onError(errorHandler);

app.get("/health", (c) => c.json({ success: true, data: { status: "ok" } }));

app.route("/auth", authRoutes);
app.route("/products", productsRoutes);
app.route("/categories", categoriesRoutes);
app.route("/customers", customersRoutes);
app.route("/cart", cartRoutes);
app.route("/orders", ordersRoutes);
app.route("/checkout", checkoutRoutes);
app.route("/inventory", inventoryRoutes);
app.route("/payments", paymentsRoutes);
app.route("/coupons", couponsRoutes);
app.route("/content", contentRoutes);
app.route("/admin/analytics", analyticsRoutes);
app.route("/admin/products", productsAdminRoutes);
app.route("/admin/categories", categoriesAdminRoutes);
app.route("/admin/uploads", uploadsRoutes);

app.notFound((c) => c.json({ success: false, message: "Not found" }, 404));

console.log(`[api] listening on http://localhost:${env.API_PORT}`);

export default {
  port: env.API_PORT,
  fetch: app.fetch,
};
