# @rajadhaniyam/database

Prisma schema and client for the Rajadhaniyam platform. Connected to a real
**Supabase** Postgres database (Phase 2 of
[`docs/DEVELOPMENT_ROADMAP.md`](../../docs/DEVELOPMENT_ROADMAP.md) — schema
migrated and seeded). `apps/api`'s route modules don't query it yet
themselves — that's Phase 3.

## Models

`User`, `AdminUser`, `Address`, `Category`, `Product`, `ProductVariant`,
`ProductImage`, `Inventory`, `Cart`, `CartItem`, `Order`, `OrderItem`,
`Payment`, `Coupon`, `Review`, `Banner`, `ContactEnquiry`.

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the full schema.

## Local setup

1. Copy `.env.example` (repo root) to `.env`, and also create
   `packages/database/prisma/.env` with the same `DATABASE_URL`/`DIRECT_URL`
   — Prisma CLI commands run with `--cwd=packages/database` load `.env`
   from `prisma/`, not the repo root. Get both connection strings from
   Supabase (Project Settings → Database → Connection string): `DATABASE_URL`
   is the pooled one ("Transaction" mode, port 6543, **must** include
   `?pgbouncer=true`), `DIRECT_URL` is the direct one (port 5432, used only
   by `prisma migrate` — the pooler can't create its shadow database).
2. From the repo root:
   ```bash
   bun run --cwd=packages/database generate      # prisma generate
   bun run --cwd=packages/database migrate:dev -- --name init
   bun run --cwd=packages/database db:seed       # seeds shop-data.ts's catalog
   ```
   (`bunx prisma ...` resolves an unrelated package from the npm registry on
   this setup — always use these workspace scripts instead.)
3. Import the client from application code:
   ```ts
   import { prisma } from "@rajadhaniyam/database";
   ```

## Seed data caveat

`prisma/seed.ts` mirrors `apps/storefront/src/lib/shop-data.ts`, but its
image URLs are placeholders (e.g. `/assets/p-kambu.jpg`) — the storefront's
real images are Vite-bundled assets with hashed filenames, and there's no
real image hosting yet (Phase 4). Replace them with real hosted URLs once
object storage is wired up.
