# @rajadhaniyam/database

Prisma schema and client for the Rajadhaniyam platform. This package is
**preparation only** — no real database is connected yet, and no migration
has been run.

## Models

`User`, `AdminUser`, `Address`, `Category`, `Product`, `ProductVariant`,
`ProductImage`, `Inventory`, `Cart`, `CartItem`, `Order`, `OrderItem`,
`Payment`, `Coupon`, `Review`, `Banner`, `ContactEnquiry`.

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the full schema.

## Getting started (next phase)

1. Provision a PostgreSQL database — this project uses **Supabase**
   (Project Settings → Database → connection string, "Transaction" pooler
   mode) — and set `DATABASE_URL` in `.env` at the repo root (copy from
   `.env.example`). Also set the same value on the `rajadhaniyam-api`
   service in Render (see [`docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md)).
2. From this directory (or via the root workspace):
   ```bash
   bun run generate      # prisma generate
   bun run migrate:dev   # prisma migrate dev --name init
   ```
3. Import the client from application code:
   ```ts
   import { prisma } from "@rajadhaniyam/database";
   ```
