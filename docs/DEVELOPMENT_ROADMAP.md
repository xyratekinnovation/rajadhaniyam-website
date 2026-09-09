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

## Phase 2 — Database + Prisma ✅

- **Objective:** Stand up a real PostgreSQL database and apply the schema
  in `packages/database/prisma/schema.prisma`.
- **Backend:** wire `packages/database`'s `prisma` client into `apps/api`.
- **Database:** provisioned on **Supabase**. Schema migrated
  (`bun run --cwd=packages/database migrate:dev -- --name init`) and seeded
  with the storefront's mock catalog
  (`bun run --cwd=packages/database db:seed`, see `prisma/seed.ts`) — 5
  categories, 10 products, 18 variants, all verified via direct Prisma
  queries against the live database.
- **Completion criteria:** `apps/api` can read/write through Prisma against
  a real database in development. ✅ Verified with a standalone script
  (`prisma.product.findFirst` with relations) — `apps/api`'s route modules
  don't query the database yet themselves, that's Phase 3.
- **Gotchas hit (see `packages/database/prisma/schema.prisma` and
  `docs/DEPLOYMENT.md`):** Supabase's pooled connection (port 6543,
  PgBouncer transaction mode) can't run `prisma migrate dev`'s shadow
  database — added a separate `directUrl` (port 5432) for migrations only.
  The pooled `DATABASE_URL` also needs a `?pgbouncer=true` query param or
  every query fails with `prepared statement "s0" already exists`.

## Phase 3 — Product / Category APIs ✅ (read side)

- **Objective:** Replace the `products`/`categories` module stubs in
  `apps/api` with real Prisma-backed handlers.
- **Backend:** `productsService`/`categoriesService` now query Prisma for
  real, mapping DB rows (Product + variants + images + review aggregate)
  to the shared `Product`/`Category` DTO shape. `GET /products` supports
  `?category=slug` and `?bestseller=true` filters. Create/update/delete
  are still `501` stubs — real admin mutations are Phase 4.
- **Frontend:** added `ApiProductRepository`/`ApiCategoryRepository` in
  `apps/storefront/src/services`, swapped the one line in
  `productService.ts`/`categoryService.ts` — no other file changed.
  Verified in-browser: homepage, `/shop` with category filtering, and a
  product detail page (weights, price, ingredients, nutrition, related
  products) all render from the real database with no visual regression.
- **Images:** seeded rows store relative paths (`/assets/p-kambu.jpg`);
  the API resolves them to an absolute URL against `STOREFRONT_URL`, and
  the actual files were copied into `apps/storefront/public/assets/` so
  they resolve for real today — a stand-in for Phase 4's real image
  hosting, not fake data.
- **Not done yet:** `apps/admin`'s `ProductsListPage`/`ProductFormPage`
  still show placeholder data (Phase 4). `shop-data.ts` was **not**
  deleted — nothing outside the Mock repositories reads it directly
  anymore, but keeping it costs nothing and it's a useful reference.
- **Completion criteria:** storefront renders the same pages from the real
  API instead of `shop-data.ts`. ✅

## Phase 4 — Admin Product Management ✅

- **Objective:** Full CRUD UI for products, categories, images, variants.
- **Backend:** `apps/api` gained `/admin/products` and `/admin/categories`
  (separate from the public `/products`/`/categories` read routes), with
  full create/update/delete backed by Prisma and validated with new
  `productInputSchema`/`categoryInputSchema` in `@rajadhaniyam/shared`.
  Category deletion is blocked with a clear `409` if products still
  reference it (FK constraint, not a raw DB error).
- **Admin:** `ProductsListPage`/`ProductFormPage` and new
  `CategoriesListPage`/`CategoryFormPage` are fully wired — variant editor
  (add/remove weight+price+mrp+stock rows), bestseller/featured toggles,
  status workflow, delete with confirmation, all via TanStack Query.
- **Image upload:** real, via Supabase Storage. `apps/api`'s
  `POST /admin/uploads` (see `apps/api/src/modules/uploads`) accepts a
  multipart file (JPEG/PNG/WebP/GIF, max 5 MB), uploads it to the
  `product-images` bucket via Supabase's Storage REST API directly (no
  `@supabase/supabase-js` dependency needed for one upload endpoint), and
  returns a public URL. `apps/admin`'s product/category forms have an
  "Upload" button next to the image URL field wired to it. Bucket creation
  is a one-time idempotent script: `bun run --cwd=apps/api setup-storage`.
- **Known gap surfaced, not fixed here:** `requireAdminAuth` is still the
  Phase-1 foundation stub (checks a header is *present*, not that it's a
  *valid* admin session) — the admin app sends a hardcoded placeholder
  token (see `apps/admin/src/services/api/client.ts`) just so these routes
  are reachable today. **Must be replaced with real auth (Phase 5) before
  any production deploy** — right now anyone who finds the API URL can
  call these mutation endpoints.
- **Bug caught during manual testing:** the storefront's flattened
  `Product` DTO collapses multiple variants into one price/mrp/stock,
  which would have silently reset real per-variant stock to a placeholder
  on every edit. Fixed by adding `ProductAdminDetail` (in
  `@rajadhaniyam/shared`) with a real `variantsDetail` array for the edit
  form to load from, instead of reconstructing lossy data.
- **Completion criteria:** an admin can create a product end-to-end and see
  it live on the storefront. ✅ Verified in-browser: created a product via
  the admin form, confirmed it appeared instantly on the public API,
  edited it (verified real per-variant stock/price round-trips correctly
  after the fix above), deleted it, and confirmed removal.

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
