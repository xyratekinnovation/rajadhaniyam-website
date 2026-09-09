# Build context is the repo root (see render.yaml's dockerContext) — this is
# a Bun workspace monorepo, so `bun install` needs every workspace member's
# package.json present to resolve `workspace:*` dependencies.
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
COPY apps/storefront apps/storefront

# vite.config.ts pins Nitro's `node-server` preset (not the cloudflare-module
# default) so this produces a plain Node server at .output/server/index.mjs —
# see the comment there before changing it.
RUN bun run --cwd=apps/storefront build

ENV NODE_ENV=production
WORKDIR /app/apps/storefront
CMD ["node", ".output/server/index.mjs"]
