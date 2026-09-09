# Development Roadmap

Each phase lists its objective and the work per layer, plus what "done"
looks like. Phases are meant to be sequential but not strictly
blocking — e.g. Phase 3 (products API) can start before Phase 2's
migrations are finalized against a hosted database.

## Phase 1 — Architecture Restructuring ✅ (this change)

- **Objective:** Split the Lovable-generated single app into a Bun
  workspace monorepo (storefront / admin / api / shared / database) without
  changing storefront behavior.
- **Backend:** `apps/api` scaffolded with Hono, modular route stubs, env
  validation, error handling middleware.
- **Frontend:** `apps/storefront` moved as-is; product/category data now
  flows through a service + mock-repository layer instead of direct
  hardcoded imports in routes.
- **Admin:** `apps/admin` scaffolded — layout, sidebar, routes for every
  planned page, table/form/state foundations, all placeholder content.
- **Database:** `packages/database` created with a full Prisma schema; not
  migrated against a real database.
- **Completion criteria:** `bun install`, `bun run typecheck`, and
  `bun run build` all succeed; the storefront's existing pages render
  unchanged.

## Phase 2 — Database + Prisma

- **Objective:** Stand up a real PostgreSQL database and apply the schema
  in `packages/database/prisma/schema.prisma`.
- **Backend:** wire `packages/database`'s `prisma` client into `apps/api`.
- **Database:** provision Postgres (local Docker or hosted), set
  `DATABASE_URL`, run `bun run --cwd=packages/database migrate:dev -- --name init`, seed initial
  categories/products from `shop-data.ts` as a one-time migration script.
- **Completion criteria:** `apps/api` can read/write through Prisma against
  a real database in development.

## Phase 3 — Product / Category APIs

- **Objective:** Replace the `products`/`categories` module stubs in
  `apps/api` with real Prisma-backed handlers.
- **Backend:** implement list/get/create/update/delete for Product,
  ProductVariant, ProductImage, Category.
- **Frontend:** add `ApiProductRepository`/`ApiCategoryRepository` in
  `apps/storefront/src/services`, swap the one line in
  `productService.ts`/`categoryService.ts` that currently instantiates the
  Mock repository.
- **Admin:** wire `ProductsListPage`/`ProductFormPage` to the real API.
- **Completion criteria:** storefront renders the same pages from the real
  API instead of `shop-data.ts`; `shop-data.ts` can then be deleted.

## Phase 4 — Admin Product Management

- **Objective:** Full CRUD UI for products, categories, images, variants.
- **Admin:** image upload, variant editor, bestseller/featured toggles,
  status workflow (draft → active → archived).
- **Backend:** validation via `@rajadhaniyam/shared` Zod schemas, image
  storage strategy (S3-compatible bucket or similar).
- **Completion criteria:** an admin can create a product end-to-end and see
  it live on the storefront.

## Phase 5 — Customer & Admin Authentication

- **Objective:** Real auth for both `User` and `AdminUser`.
- **Backend:** password hashing, JWT/session issuance, `requireAuth` /
  `requireAdminAuth` middleware implemented for real, role checks.
- **Frontend:** login/register/forgot-password/profile/address pages,
  auth-aware header.
- **Admin:** working login page, protected routes, role-based nav.
- **Database:** `User`, `AdminUser`, `Address` tables in active use.
- **Completion criteria:** a customer can register/login/manage addresses;
  an admin can log in and is blocked from admin routes when logged out.

## Phase 6 — Cart Synchronization

- **Objective:** Server-backed cart with guest + logged-in sync.
- **Backend:** implement `apps/api/src/modules/cart` against `Cart`/`CartItem`.
- **Frontend:** `src/lib/cart.tsx` gains an optional server-sync layer
  (merge guest cart into user cart on login) without changing the
  `useCart()` API surface components already use.
- **Completion criteria:** cart persists across sessions/devices for a
  logged-in user.

## Phase 7 — Checkout + Address

- **Objective:** Real checkout: address selection, shipping calc, coupon
  application, inventory validation, order creation.
- **Backend:** `checkout` route creates an `Order` + `OrderItem`s
  transactionally, decrements `Inventory`.
- **Frontend:** `routes/checkout.tsx` submits to `checkoutApi.createOrder`
  instead of only clearing local cart state.
- **Completion criteria:** placing an order creates a real `Order` row and
  redirects to `/order-success` with a real order number.

## Phase 8 — Orders

- **Objective:** Order history and detail views for both customer and admin.
- **Frontend:** customer "My Orders" page.
- **Admin:** `OrdersListPage`/`OrderDetailPage` show real data, status
  updates.
- **Completion criteria:** a customer can view past orders; an admin can
  update order status.

## Phase 9 — Payment Gateway

- **Objective:** Integrate a real Indian payment provider (Razorpay/Cashfree
  or similar).
- **Backend:** `apps/api/src/modules/payments` implements intent creation
  and webhook verification, updates `Payment`/`Order.paymentStatus`.
- **Completion criteria:** a test payment completes end-to-end in sandbox
  mode.

## Phase 10 — Inventory

- **Objective:** Real stock tracking per `ProductVariant`.
- **Backend:** `Inventory` reservations on checkout, release on cancel.
- **Admin:** low-stock indicators, manual stock adjustment.
- **Completion criteria:** out-of-stock variants can't be checked out.

## Phase 11 — Coupons

- **Objective:** Discount codes.
- **Backend:** `Coupon` validation (percentage/flat, min order value,
  expiry) applied at checkout.
- **Admin:** coupon CRUD.
- **Completion criteria:** a valid coupon reduces the checkout total.

## Phase 12 — CMS / Banner Management

- **Objective:** Editable homepage content without a code deploy.
- **Backend:** `Banner` CRUD, simple content-block storage.
- **Admin:** `BannersPage`/`ContentPage` become real editors.
- **Frontend:** homepage hero/category sections read from the content API
  with the current hardcoded copy as a fallback.
- **Completion criteria:** an admin can change the homepage hero image/copy
  without a deploy.

## Phase 13 — Analytics

- **Objective:** Real numbers on the admin dashboard.
- **Backend:** `analytics` module aggregates orders/revenue/customers.
- **Admin:** `DashboardPage` stat cards and recent-orders table go live.
- **Completion criteria:** dashboard reflects real order data.

## Phase 14 — Testing / Security

- **Objective:** Confidence before production traffic.
- **All layers:** unit tests for services, integration tests for API
  routes, security review (auth, input validation, rate limiting on
  auth/checkout endpoints).
- **Completion criteria:** CI runs typecheck + lint + tests on every PR.

## Phase 15 — Production Deployment

- **Objective:** Ship it.
- **Backend/Database:** hosted Postgres, `apps/api` deployed behind HTTPS.
- **Frontend/Admin:** `apps/storefront` (SSR) and `apps/admin` (static)
  deployed, environment variables set from `.env.example`.
- **Completion criteria:** rajadhaniyam.com serves the storefront, a
  separate admin subdomain serves the dashboard, both talk to the deployed
  API.
