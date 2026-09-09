import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { LoginPage } from "./routes/login";
import { DashboardPage } from "./routes/dashboard";
import { ProductsListPage } from "./routes/products/ProductsListPage";
import { ProductFormPage } from "./routes/products/ProductFormPage";
import { CategoriesPage } from "./routes/categories";
import { OrdersListPage } from "./routes/orders/OrdersListPage";
import { OrderDetailPage } from "./routes/orders/OrderDetailPage";
import { CustomersPage } from "./routes/customers";
import { InventoryPage } from "./routes/inventory";
import { CouponsPage } from "./routes/coupons";
import { BannersPage } from "./routes/banners";
import { ContentPage } from "./routes/content";
import { SettingsPage } from "./routes/settings";

// Admin is a plain CSR SPA (no SSR needed for an authenticated dashboard),
// so routes are defined in code rather than via file-based codegen — there
// is no routeTree.gen.ts to worry about here.
const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});
const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: ProductsListPage,
});
const newProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/new",
  component: ProductFormPage,
});
const editProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  component: ProductFormPage,
});
const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categories",
  component: CategoriesPage,
});
const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersListPage,
});
const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: OrderDetailPage,
});
const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: CustomersPage,
});
const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: InventoryPage,
});
const couponsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coupons",
  component: CouponsPage,
});
const bannersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/banners",
  component: BannersPage,
});
const contentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content",
  component: ContentPage,
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  productsRoute,
  newProductRoute,
  editProductRoute,
  categoriesRoute,
  ordersRoute,
  orderDetailRoute,
  customersRoute,
  inventoryRoute,
  couponsRoute,
  bannersRoute,
  contentRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
