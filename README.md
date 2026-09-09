<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Rajadhaniyam

"Our Tradition, Your Health" — a premium D2C storefront for millets,
stone-ground flours, ready mixes, nuts and seeds.

The original creative brief lives in [`docs/DESIGN_BRIEF.md`](docs/DESIGN_BRIEF.md).
Live storefront: https://tradition-table-craft.lovable.app

## Architecture

This is a Bun workspace monorepo: one customer storefront, one admin panel,
one API, shared packages between them. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full reasoning
behind the layout (why the storefront stays one TanStack Start app, why
admin is a plain SPA, why the API is a separate service).

```
/
├── apps/
│   ├── storefront/   # customer site — TanStack Start (SSR), React 19, Tailwind
│   ├── admin/         # admin dashboard — Vite + React + TanStack Router (CSR)
│   └── api/           # backend API — Hono on Bun
├── packages/
│   ├── shared/         # cross-app types, Zod schemas, constants, utils
│   ├── database/       # Prisma schema + client (not connected to a real DB yet)
│   ├── ui/              # seed for a future shared component library
│   └── config/          # shared tsconfig base
└── docs/
    ├── ARCHITECTURE.md
    ├── DEVELOPMENT_ROADMAP.md
    └── DESIGN_BRIEF.md
```

## Tech Stack

| Layer      | Stack                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Storefront | React 19, TypeScript, TanStack Start, TanStack Router, TanStack Query, Vite, Tailwind CSS v4, Radix UI / shadcn, React Hook Form, Zod |
| Admin      | React 19, TypeScript, TanStack Router (code-based), TanStack Query, Vite, Tailwind CSS v4                                             |
| API        | Hono, Bun, Zod                                                                                                                        |
| Database   | PostgreSQL + Prisma (schema prepared, not yet migrated)                                                                               |
| Tooling    | Bun workspaces, ESLint, Prettier                                                                                                      |

## Local Installation

Requires [Bun](https://bun.sh) 1.x.

```bash
bun install
cp .env.example .env
```

`bun install` links the workspace packages (`@rajadhaniyam/shared`,
`@rajadhaniyam/database`, `@rajadhaniyam/ui`) into each app automatically —
no separate build step needed for local development.

## Running the apps

```bash
bun run dev             # storefront only (default) — http://localhost:8080
bun run dev:storefront   # same as above, explicit
bun run dev:admin        # admin dashboard — http://localhost:4001
bun run dev:api          # backend API — http://localhost:4000
```

Run storefront + admin + api together by opening three terminals with the
commands above (no orchestration tool is used — keeping `dev` simple to
reason about was preferred over adding a process manager for three
services).

## Building

```bash
bun run build             # builds storefront, admin and api in sequence
bun run build:storefront
bun run build:admin
bun run build:api
```

## Quality checks

```bash
bun run typecheck   # tsc --noEmit across every app/package
bun run lint         # eslint across storefront + admin
bun run format       # prettier --write .
```

## Environment Variables

Copy [`.env.example`](.env.example) to `.env` at the repo root. See that
file for the full list and comments; short version:

| Variable                                          | Used by                         | Notes                                                     |
| ------------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                                    | `packages/database`, `apps/api` | Supabase pooled connection string, needs `?pgbouncer=true` |
| `DIRECT_URL`                                      | `packages/database`             | Supabase direct connection — `prisma migrate` only         |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`       | `apps/api`                      | Product/category image uploads — never expose as `VITE_*`  |
| `JWT_SECRET`, `SESSION_SECRET`                    | `apps/api`                      | Server-only, generate real random values before deploying |
| `API_PORT`                                        | `apps/api`                      | Defaults to `4000`                                        |
| `STOREFRONT_URL`, `ADMIN_URL`                     | `apps/api`                      | Used for CORS allow-list                                  |
| `VITE_API_BASE_URL`                               | `apps/storefront`, `apps/admin` | Browser-accessible — must keep the `VITE_` prefix         |
| `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET` | (future) `apps/api`             | Not integrated yet                                        |

`apps/storefront/.env.example` and `apps/api/.env.example` mirror the
subset each app actually reads, since Vite/Bun read `.env` relative to each
app's own directory in dev.

## Database Preparation

`packages/database/prisma/schema.prisma` defines the full schema (`User`,
`AdminUser`, `Address`, `Category`, `Product`, `ProductVariant`,
`ProductImage`, `Inventory`, `Cart`, `CartItem`, `Order`, `OrderItem`,
`Payment`, `Coupon`, `Review`, `Banner`, `ContactEnquiry`), migrated against
a real Supabase database and seeded with the storefront's mock catalog. See
[`packages/database/README.md`](packages/database/README.md) for local
setup (each contributor needs their own `DATABASE_URL`/`DIRECT_URL` in a
local `.env` — never committed).

## What's real vs. mocked today

- **Product/category data** — real. `apps/storefront/src/services/products`
  and `.../categories` read through `ApiProductRepository`/
  `ApiCategoryRepository`, which call `apps/api`, which queries Prisma
  against Supabase. `apps/storefront/src/lib/shop-data.ts` still exists
  (kept as reference/seed source) but nothing outside the old
  `MockProductRepository`/`MockCategoryRepository` reads it anymore.
- **Customer auth** — real. `/login`, `/register`, `/account` (profile +
  address management) are backed by `apps/api`. Session lives in
  `localStorage` (not a cookie), so it's client-side only — see
  `apps/storefront/src/lib/auth.tsx`'s comment for what that means for SSR.
- **Cart** — real. `apps/storefront/src/lib/cart.tsx` still keeps local
  React state as the source of truth for instant UI feedback (same
  `useCart()` surface, no component changed), backed by a real server
  cart (`apps/api`'s `/cart`) for both guests (a persistent per-browser
  session id) and logged-in customers, merged automatically on
  login/register.
- **Checkout** — the form UI is real; submitting still just clears the
  local cart and navigates to `/order-success`, no order is created yet
  (Phase 7).
- **`apps/api`** — `products` and `categories` are real, including admin
  create/update/delete under `/admin/products`/`/admin/categories`
  (Phase 4), now actually protected by real JWT verification (Phase 5).
  `auth` is real: register/login (customer + separate admin credential
  set), `/auth/me`, full address CRUD. `cart` is real (Phase 6, guest +
  logged-in sync). Every other module (`customers`, `orders`,
  `inventory`, `payments`, `coupons`, `content`, `analytics`) is still
  scaffolded with real route shapes and Zod validation but no business
  logic yet.
- **`apps/admin`** — Products and Categories (list/add/edit/delete) are
  real, backed by `apps/api`. Every other planned page (Dashboard, Orders,
  Order Detail, Customers, Inventory, Coupons, Banners, Content, Settings,
  Login) exists and is reachable with layout/table/form foundations, but
  isn't wired to real data yet.
- **`packages/database`** — real Supabase database, schema migrated and
  seeded (5 categories, 10 products, 18 variants) — see
  [`packages/database/README.md`](packages/database/README.md).

## What's ready for backend integration

- `packages/shared` types/Zod schemas are the single source of truth both
  the storefront's mock data and `apps/api`'s route validation already use
  — no type duplication to reconcile later.
- `apps/storefront/src/services/api/*` is a working `fetch` client layer
  pointed at `VITE_API_BASE_URL`, just not called by the repositories yet.
- `apps/api` responds on real routes today (`/health`, `/products`,
  `/categories`, ...) with the same `ApiResponse`/`PaginatedResponse`
  envelope the storefront's API client already expects.

## Roadmap

See [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md) for the
phase-by-phase plan from here through production deployment.

---

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c5fc8b11-9dd0-42e0-aa38-1de20d3c243c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.
