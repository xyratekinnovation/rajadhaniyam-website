import { createRootRoute, createRoute, createRouter, Outlet, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/auth";
import { LoginPage } from "./routes/login";
import { DashboardPage } from "./routes/dashboard";
import { ProductsListPage } from "./routes/products/ProductsListPage";
import { ProductFormPage } from "./routes/products/ProductFormPage";
import { CategoriesListPage } from "./routes/categories/CategoriesListPage";
import { CategoryFormPage } from "./routes/categories/CategoryFormPage";
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
//
// Route guard lives on the root, not per-route: every navigation checks for
// a stored token and bounces to /login if it's missing. This only checks
// *presence* — an expired/invalid token still gets past this guard and into
// the page, but the first API call it makes 401s and client.ts's
// handleUnauthorized() clears the session and redirects from there instead.
const rootRoute = createRootRoute({
  component: () => <Outlet />,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/login") return;
    if (!getToken()) throw redirect({ to: "/login" });
  },
});

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
  component: CategoriesListPage,
});
const newCategoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categories/new",
  component: CategoryFormPage,
});
const editCategoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categories/$categoryId",
  component: CategoryFormPage,
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
  newCategoryRoute,
  editCategoryRoute,
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
