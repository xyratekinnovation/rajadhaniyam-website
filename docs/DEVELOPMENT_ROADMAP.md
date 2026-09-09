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

## Phase 5 — Customer & Admin Authentication ✅ (except forgot-password)

- **Objective:** Real auth for both `User` and `AdminUser`.
- **Backend:** `Bun.password.hash`/`verify` (argon2id, no new dependency)
  for password hashing; `hono/jwt`'s `sign`/`verify` (already ships with
  the installed `hono` package) for stateless JWTs — see
  `apps/api/src/utils/jwt.ts`. Tokens are discriminated by a `type:
  "customer" | "admin"` claim so a customer token can never pass
  `requireAdminAuth` even if a role name were to collide.
  `requireAuth`/`requireAdminAuth` (`apps/api/src/middleware/auth.ts`) now
  verify real JWTs instead of just checking a header is present — this
  closes the Phase 4 security gap where any request with *any* bearer
  token could reach `/admin/*`.
  `POST /auth/register`, `/auth/login`, `/auth/admin/login`, `GET
  /auth/me`, and `/auth/addresses` (full CRUD, ownership-checked so one
  customer can't read/edit/delete another's address) are real.
  `forgot-password`/`reset-password` are still `501` stubs — no email
  sending infrastructure exists yet, out of scope here.
- **Admin accounts have no self-serve signup** (by design — this isn't a
  public registration surface). Provisioned via
  `bun run --cwd=apps/api create-admin -- <email> <password> <name>
  [role]`, idempotent (upserts by email, so re-running it resets a
  password). Already run once against the shared Supabase database — the
  same admin account works in every environment pointed at that database,
  including after a Render deploy; no need to re-run there.
- **Frontend (storefront):** real `/login`, `/register`, `/account`
  (profile + full address management — add/delete, verified persisting
  across reloads) pages (`apps/storefront/src/lib/auth.tsx` +
  `src/routes/{login,register,account}.tsx`). Header's account icon now
  routes to `/account` or `/login` based on real auth state, instead of
  linking out to the admin app (a stray leftover from before auth
  existed). **Auth state lives in `localStorage`, not a cookie** — this
  app is SSR (TanStack Start), and localStorage doesn't exist on the
  server, so auth state always renders "logged out" on the server/first
  paint and corrects client-side after mount (matches how `CartProvider`
  already behaves). Practical effect: `/account`'s data loads client-side
  after mount, not via an SSR route loader like every other page here.
- **Admin:** real login page, `POST /auth/admin/login`-backed
  (`apps/admin/src/routes/login.tsx`). Route guard lives once on the
  router root (`beforeLoad` checks for a stored token, `redirect`s to
  `/login` otherwise) rather than per-route. `client.ts` now sends the
  real stored token (replacing Phase 4's placeholder) and clears the
  session + redirects to `/login` on any `401`. Role-based nav
  differentiation (hide items by `AdminRole`) not done — no admin-only
  page exists yet that would need it.
- **Database:** `User`, `AdminUser`, `Address` tables in active use.
- **Completion criteria:** a customer can register/login/manage addresses
  ✅; an admin can log in and is blocked from admin routes when logged out
  ✅. Both verified in-browser end to end (not just via curl), including
  the redirect-when-logged-out behavior on both apps.

## Phase 6 — Cart Synchronization ✅

- **Objective:** Server-backed cart with guest + logged-in sync.
- **Backend:** `apps/api/src/modules/cart` is real, against `Cart`/
  `CartItem`. Works for both guests and logged-in customers off one
  `optionalAuth` middleware (`apps/api/src/middleware/auth.ts`) — a valid
  customer JWT identifies the cart by `userId`; otherwise a client-
  generated `X-Cart-Session` header identifies it by `sessionId`. Adding a
  product resolves `productSlug` + `weight` to the real `ProductVariant`
  server-side, so the storefront never needs to know raw variant ids.
  `/auth/register` and `/auth/login` read that same header and merge the
  guest cart into the new/existing user's cart in one transaction
  (summing quantities for shared variants), then discard the guest cart
  row — see `cartService.mergeGuestCartIntoUser`.
- **Frontend:** `src/lib/cart.tsx` keeps local React state as the source of
  truth for instant UI feedback (unchanged `useCart()` surface — no
  component was touched), backed by a best-effort sync layer: every
  mutation updates local state optimistically *and* fires the matching
  API call, reconciling `lines` with the server's response once it lands;
  failures are swallowed since a flaky network shouldn't block adding to
  cart. The cart re-hydrates from the server on mount and whenever the
  logged-in identity changes (login/logout), which is what actually picks
  up a just-merged cart after login. `src/lib/cartSession.ts` holds the
  permanent per-browser guest session id (a `crypto.randomUUID()` in
  `localStorage`, unrelated to and outliving any login session).
  Documented known gap in `cart.tsx`: rapid actions on a line added
  moments ago can race its still-in-flight `add()` server call, since
  `setQty`/`remove` send whatever `id` is currently in state — not
  worth a request-queue for this phase.
- **Completion criteria:** cart persists across sessions/devices for a
  logged-in user. ✅ Verified in-browser (guest add → hard reload → still
  there) and via direct database inspection for the merge-on-login path
  (a second browser session's login correctly combined a new guest item
  into an existing account's cart, matching quantities summed correctly).

## Phase 7 — Checkout + Address ✅ (Cash on Delivery only — see Phase 9)

- **Objective:** Real checkout: address selection, shipping calc, coupon
  application, inventory validation, order creation.
- **Payment methods:** only `cod` is accepted — the client hasn't finished
  Razorpay account approval (pending ~24h at time of writing), so online
  payment (`upi`/`card`/`netbanking`) is rejected server-side with a clear
  `503` rather than creating an order that could never actually be paid
  for. The storefront's payment step shows those options as visibly
  disabled ("Coming soon") rather than hiding them, so it's clear this is
  temporary. Wiring Razorpay in alongside COD (not replacing it) is
  Phase 9's job once credentials arrive.
- **Coupons:** rejected with a clear `400` ("Coupons aren't available
  yet") if `couponCode` is provided, rather than silently ignoring it —
  Phase 11's job.
- **Backend:** `POST /checkout` (`apps/api/src/modules/orders/orders.service.ts`)
  works for guests and logged-in customers (same identity resolution as
  the cart — extracted into `utils/cartIdentity.ts` since both needed it).
  Validates stock against each item's live `ProductVariant.stock`,
  computes subtotal/shipping/COD surcharge/total, and — inside one
  transaction — creates the `Order` + `OrderItem`s + a `Payment` row
  (`provider: "cod"`, `status: PENDING`), decrements
  `ProductVariant.stock` (mirroring into `Inventory.quantity` too, even
  though that table isn't the active source of truth until Phase 10's
  reservation system), and clears the cart.
- **Schema change:** added `Order.email` and `Order.shippingSnapshot`
  (migration `add_order_email_shipping_snapshot`). `Address.userId` is
  required, so a guest checkout has nowhere to attach a saved address —
  and a snapshot taken at order time is the more correct design anyway,
  regardless of guest/logged-in, since a saved address can change or be
  deleted after the order ships. `shippingAddressId` is kept on the model
  for a future "reorder" link to a saved address but isn't written to yet.
- **Bug found and fixed during testing, not by design:** a JWT stays
  cryptographically valid after the account behind it is deleted (no
  server-side revocation list) — surfaced as a `500` (foreign key
  violation) the first time a stale customer token tried to create a
  cart. Fixed by having `requireAuth`/`optionalAuth`/`requireAdminAuth`
  confirm the referenced account still exists, not just that the
  signature checks out (`apps/api/src/middleware/auth.ts`). This will
  happen for real (an admin deleting a customer while they're logged in),
  not just during development cleanup — worth knowing about for any
  future auth work.
- **Frontend:** `routes/checkout.tsx` submits to `checkoutApi.createOrder`
  for real, prefills contact info from a logged-in customer, and shows
  the real API error message on failure (out-of-stock, empty cart, etc.)
  instead of always succeeding. `routes/order-success.tsx` reads the real
  order number from a `?orderNumber=` search param instead of a
  hardcoded one.
- **Completion criteria:** placing an order creates a real `Order` row and
  redirects to `/order-success` with a real order number. ✅ Verified
  fully in-browser: added a real product to a guest cart, completed
  checkout with real form input, landed on the confirmation page showing
  the actual generated order number, and confirmed in the database that
  the `Order`/`OrderItem`/`Payment` rows, the shipping snapshot, and the
  stock decrement were all exactly correct.

## Phase 8 — Orders ✅

- **Objective:** Order history and detail views for both customer and admin.
- **Backend:** admin order management split out of the customer-facing
  `orders.routes.ts` into `orders.admin.routes.ts`, mounted at
  `/admin/orders` — consistent with the `/admin/products`,
  `/admin/categories` pattern (Phase 7 had briefly nested admin routes
  under `/orders/admin/...`, inconsistent with that pattern; fixed here
  rather than working around it with an ad-hoc client path). Added
  `ordersService.getById` (admin — no ownership check, unlike
  `getForCustomer`).
- **Frontend (storefront):** `routes/orders/index.tsx` ("My Orders") and
  `routes/orders/$orderId.tsx` (detail), same client-side-only pattern as
  `/account` (see its comment — auth state doesn't exist during SSR).
- **Bug found and fixed during testing, not by design:** these two started
  as flat files, `routes/orders.tsx` and `routes/orders.$orderId.tsx`.
  Under TanStack Router's file-based convention, a bare `<name>.tsx`
  sibling to `<name>.$param.tsx` becomes an implicit **layout route** for
  everything under `/<name>/*` — since `orders.tsx` didn't render an
  `<Outlet />`, navigating to an order's detail page updated the URL and
  page `<title>` (the route did match) but silently kept showing the list
  page's content underneath. Fixed by moving both into an `orders/`
  directory (`index.tsx` + `$orderId.tsx`) so neither implicitly nests
  inside the other. Worth remembering for any future list+detail page
  pair added the same way.
- **Admin:** `OrdersListPage` (real data, status badges, link to detail)
  and `OrderDetailPage` (line items, shipping address, payment info, and
  a status dropdown wired to `PATCH /admin/orders/:id/status`) are both
  real.
- **Completion criteria:** a customer can view past orders ✅; an admin
  can update order status ✅. Verified fully in-browser end to end: an
  admin changed a real order's status to "confirmed," and the customer's
  own order history and detail page immediately reflected it.

## Phase 9 — Payment Gateway

- **Objective:** Integrate Razorpay (client's account, pending approval as
  of Phase 7) as a real payment provider, **alongside** Cash on Delivery
  — not replacing it. Blocked on the client providing API credentials
  once their account is approved.
- **Backend:** `apps/api/src/modules/payments` implements intent creation
  and webhook verification, updates `Payment`/`Order.paymentStatus`. In
  `orders.service.ts`, remove the "only `cod` is accepted" guard added in
  Phase 7 (search for the comment referencing this phase) once Razorpay
  intent creation exists for the other payment methods.
- **Frontend:** re-enable the disabled "Coming soon" UPI/Card/Netbanking
  options in `routes/checkout.tsx`'s `PAYMENT_OPTIONS`.
- **Completion criteria:** a test payment completes end-to-end in sandbox
  mode.

## Phase 10 — Inventory ✅

- **Objective:** Real stock tracking per `ProductVariant`.
- **Backend:** "reservation on checkout" is effectively what Phase 7
  already does — COD orders have no separate payment-pending state to
  wait through, so decrementing `ProductVariant.stock` immediately at
  order creation *is* the commit. What Phase 10 adds: `orders.service.ts`
  `updateStatus` now **releases stock** (restores each item's qty) when
  an order transitions into `cancelled` from anything else, inside the
  same transaction as the status change — guarded so re-saving an
  already-cancelled order can't double-release. New
  `apps/api/src/modules/inventory` (mounted at `/admin/inventory`, moved
  off the old inconsistent bare `/inventory`): `GET /` lists every
  variant with a computed `lowStock` flag (`LOW_STOCK_THRESHOLD = 10` in
  `@rajadhaniyam/shared`), `PATCH /:variantId` sets an absolute stock
  count (not a delta — simpler, less surprising for an admin typing a
  number in).
- **Admin:** `InventoryPage` lists every variant sorted lowest-stock-first,
  with an inline-editable stock field (blur or Enter commits) and a "Low
  stock" badge.
- **Completion criteria:** out-of-stock variants can't be checked out —
  already true since Phase 7's stock check in `createOrder`; re-verified
  still correct here. Also verified: cancelling a real order via the admin
  UI restores the exact quantity to the variant's stock (and its
  `Inventory.quantity` mirror), and cancelling it again doesn't
  double-release.

## Phase 11 — Coupons ✅

- **Objective:** Discount codes.
- **Backend:** `couponsService.validate(code, subtotal)` (in
  `apps/api/src/modules/coupons`) checks active, not expired, and
  `subtotal >= minOrderValue`, then computes the discount — percentage or
  flat, capped so it can never exceed the subtotal. Used two ways: `POST
  /coupons/validate` (public) is what the storefront's "Apply coupon"
  button previews against, and `orders.service.ts`'s `createOrder`
  **re-validates independently** at actual checkout rather than trusting
  a client-supplied discount, since the preview could be stale (cart
  changed, coupon deactivated) by submission time. Admin CRUD lives at
  `/admin/coupons`; deleting a coupon already used by an order is blocked
  with a `409` (same pattern as categories' product-count guard) rather
  than silently orphaning that order's discount attribution. Coupon codes
  are case-insensitive (normalized to uppercase on both write and read).
- **Admin:** `CouponsPage` — list, add/edit (single-page form, no separate
  route), delete.
- **Frontend (storefront):** `routes/checkout.tsx` gained a coupon input
  + Apply button, showing the discount line and adjusted total once
  applied.
- **Completion criteria:** a valid coupon reduces the checkout total. ✅
  Verified fully in-browser: created a 15% coupon in the real admin UI,
  applied it (typed lowercase, confirming case-insensitive matching) on
  the real storefront checkout, completed the order, and confirmed in the
  database that the stored discount/total matched exactly (₹95 subtotal →
  ₹14.25 discount → ₹154.75 total, including the COD surcharge).

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
