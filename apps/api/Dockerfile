# Build context is the repo root (see render.yaml's dockerContext) because
# this is a Bun workspace monorepo — `bun install` needs every workspace
# member's package.json present to resolve `workspace:*` dependencies.
#
# Single-stage on purpose: Bun runs TypeScript directly (no separate compile
# step needed), and Prisma's generated client relies on relative paths to its
# query-engine binary inside node_modules/.prisma — copying node_modules
# across a multi-stage COPY risks breaking Bun's workspace symlinks and
# Prisma's engine lookup. Optimize for image size later, once Phase 2 has a
# real DATABASE_URL to test against.
FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN bun install --frozen-lockfile

COPY packages packages
COPY apps/api apps/api

# Needs only the schema file, not a live DATABASE_URL — generates the Prisma
# client into node_modules so `import { PrismaClient } from "@prisma/client"`
# resolves at boot. Runs via the workspace script (not `bunx prisma`), which
# resolves to some unrelated globally-published "prisma" package instead of
# this repo's pinned devDependency.
RUN bun run --cwd=packages/database generate

ENV NODE_ENV=production
WORKDIR /app/apps/api
CMD ["bun", "run", "src/index.ts"]
