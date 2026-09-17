# GCP / Cloud Run Migration Status

This file tracks the experimental migration of the Rajadhaniyam API from
Render to Google Cloud Run for evaluation. It is a **staging experiment**,
not a committed migration — Render remains the production/rollback
environment throughout. This file contains **no secret values**, only
architecture, URLs, variable names, and status.

Branch: `migration/cloudflare-storefront`
Do not merge into `master` without explicit approval.

## Current architecture (before this migration)

```
Storefront (Render, Docker, node-server preset) ──┐
Admin (Render, static)                            ├──► API (Render, Docker, Bun/Hono)
Cloudflare Workers preview (storefront, this       │         │
  branch only, cloudflare-module preset) ──────────┘         ▼
                                                    Supabase Postgres (pooled)
                                                    Supabase Storage
                                                    Razorpay (live keys, production webhook)
```

## Current URLs

| Service | URL | Status |
|---|---|---|
| Production storefront | https://rajadhaniyam-storefront.onrender.com | Live, unaffected by this work |
| Production admin | https://rajadhaniyam-admin.onrender.com | Live, unaffected |
| Production API | https://rajadhaniyam-api.onrender.com | Live — **rollback target, must stay running** |
| Cloudflare storefront preview | https://rajadhaniyam-storefront-preview.xyratekinnovation.workers.dev | Live, currently points at Render API |
| Cloud Run API (staging) | https://rajadhaniyam-api-staging-855749773400.asia-south1.run.app | Deployed, verified healthy — **but private** (org policy blocks public access, see below); not yet connected to the Cloudflare preview |

## GCP project

- **Project ID**: `xyratek-websites` (project number `855749773400`, org-owned)
- **Account**: monisha@xyratek.in
- **Region**: `asia-south1` (Mumbai) — not yet used for any resource
- **Billing**: linked (billing account `01A483-864B03-A52A14` — id only, not a secret, needed to enable any paid-tier-capable API)
- **APIs enabled**: `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`, `secretmanager.googleapis.com`
- **GCP resources created so far**: none (no Cloud Run service, no Artifact Registry repo, no secrets)

## Migration objective

Evaluate Cloud Run as a replacement for Render's free-tier API hosting
(cold starts were the original motivation — see `docs/DEPLOYMENT.md`'s
keep-warm workaround). Target flow once validated:

```
Cloudflare Workers Preview → Cloud Run API (asia-south1) → Supabase Postgres/Storage
```

Render continues running independently as rollback throughout and after.

## Deployment status

- [x] Cloudflare Workers storefront preview deployed and live (this branch)
- [x] Uncommitted Cloudflare migration files committed (`b5e6ca4`) and pushed to `origin/migration/cloudflare-storefront`
- [x] GCP project `xyratek-websites` confirmed accessible (org-owned, created 2026-09-17)
- [x] Billing account linked to the project (required before any API could be enabled)
- [x] GCP APIs enabled: Cloud Run Admin API, Cloud Build API, Artifact Registry API, Secret Manager API
- [x] Artifact Registry Docker repository created: `rajadhaniyam-api` (asia-south1)
- [x] Secrets created in Secret Manager (6 of 7 — see below; `PAYMENT_WEBHOOK_SECRET` intentionally not created)
- [x] Cloud Run API image built and pushed — see "Artifact Registry / build" section below
- [x] Cloud Run API deployed — service `rajadhaniyam-api-staging`, revision `rajadhaniyam-api-staging-00001-44h`
- [x] `/health` verified on Cloud Run (200, via authenticated test request — see blocker below)
- [x] DB connectivity verified from Cloud Run (`GET /products` returned real Supabase data)
- [ ] Cloudflare preview repointed at Cloud Run API — **blocked, see below**
- [ ] Manual page-by-page verification against Cloud Run
- [ ] Performance/stability comparison vs Render

## Environment variables required (names only — no values here or anywhere in git)

### Secrets
- `DATABASE_URL` — Supabase pooled connection string; **must** include `?pgbouncer=true`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `PAYMENT_PROVIDER_KEY` — Razorpay Key ID (**TEST mode only** for this staging deployment)
- `PAYMENT_PROVIDER_SECRET` — Razorpay Key Secret (**TEST mode only**)
- `PAYMENT_WEBHOOK_SECRET` — not created for staging yet (no webhook registered against Cloud Run)

### Non-secret configuration
- `NODE_ENV=production`
- `SUPABASE_URL`
- `STOREFRONT_URL` — set to the Cloudflare preview URL for this deployment
- `ADMIN_URL` — Render admin URL (admin panel isn't part of this migration)
- `EXTRA_CORS_ORIGINS` — must include the Cloudflare preview origin so it can call the Cloud Run API

### Provided automatically by Cloud Run
- `PORT` — Cloud Run injects this; the app already reads `process.env.PORT` correctly, no code change needed

## Changes made so far

- Committed previously-uncommitted Cloudflare migration files (`vite.config.ts`, `package.json`, `wrangler.json`, `bun.lock`) — commit `b5e6ca4` on `migration/cloudflare-storefront`, pushed to origin.
- Installed `gcloud` CLI locally and authenticated as `monisha@xyratek.in`.
- Linked billing account `01A483-864B03-A52A14` to `xyratek-websites` (was required — API enablement fails without it).
- Enabled the 4 required GCP APIs (Cloud Run, Cloud Build, Artifact Registry, Secret Manager).
- Created Artifact Registry Docker repository `rajadhaniyam-api` in `asia-south1`.
- Granted the project's Compute Engine default service account (`855749773400-compute@developer.gserviceaccount.com`, used by Cloud Build here) three IAM roles it didn't have by default on this new project: `roles/storage.objectViewer` (read the uploaded source tarball), `roles/artifactregistry.writer` (push the built image), `roles/logging.logWriter` (build log write access). None of these are secrets; they're standard IAM role grants on the project's own service account, required for the build pipeline to function at all on a freshly created project.
- Added `cloudbuild.yaml` (repo root) and `.gcloudignore` (repo root) — build/deploy config files, not application source. `cloudbuild.yaml` exists because the API's Dockerfile lives at `apps/api/Dockerfile`, not the repo root, and `gcloud builds submit --tag` only supports a Dockerfile at the source root; an explicit config was the only way to keep building `apps/api/Dockerfile` unmodified from a repo-root context (required for the Bun workspace).
- Built and pushed the API image via Cloud Build — see "Artifact Registry / build" below. **The existing `apps/api/Dockerfile` required zero modifications** — it built and ran `bun install` + `prisma generate` successfully unchanged.
- No production system touched: Render, Cloudflare production, DNS, and Razorpay (production webhook and credentials) remain completely untouched throughout.

## Artifact Registry / build

- **Repository**: `rajadhaniyam-api`, region `asia-south1`, format Docker
- **Image**: `asia-south1-docker.pkg.dev/xyratek-websites/rajadhaniyam-api/rajadhaniyam-api:f2196591fa87` (tag = short git SHA of the `migration/cloudflare-storefront` commit this was built from, `f219659`)
- **Digest**: `sha256:2d2861c7f81b52cdbfa306004bfd286404f2e69f0726d5d550793905647c2568`
- **Build ID**: `4edce21d-0ec7-4df0-8c62-29cf6f3a2d77` (2m3s, status SUCCESS)
- **Dockerfile used**: `apps/api/Dockerfile`, unmodified, via `cloudbuild.yaml`'s explicit `-f` flag; build context = repo root

## Cloud Run staging deployment

- **Service**: `rajadhaniyam-api-staging`
- **Region**: `asia-south1`
- **Revision**: `rajadhaniyam-api-staging-00001-44h`
- **Service URL**: `https://rajadhaniyam-api-staging-855749773400.asia-south1.run.app`
- **Image**: same digest as above (`sha256:2d2861c7f81b52cdbfa306004bfd286404f2e69f0726d5d550793905647c2568`) — no rebuild
- **Resources**: 1 vCPU, 512Mi memory, min-instances 1, max-instances 3, concurrency 80 (default), request-based CPU allocation (not always-allocated)
- **Runtime service account**: `855749773400-compute@developer.gserviceaccount.com` (project's Compute Engine default SA)
- **Secrets attached** (names only, mounted via `secretKeyRef` → `latest`): `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET`. `PAYMENT_WEBHOOK_SECRET` intentionally not created/attached (see below).
- **Non-secret env vars**: `NODE_ENV=production`, `STOREFRONT_URL=<Cloudflare preview URL>`, `ADMIN_URL=https://rajadhaniyam-admin.onrender.com` (existing real admin URL, not invented — admin panel isn't part of this migration), `EXTRA_CORS_ORIGINS=<same Cloudflare preview URL>`
- **Verification**: `GET /health` → 200; `GET /products` → 200 with real Supabase data (DB connectivity confirmed end-to-end); logs show clean startup on `PORT=8080` with zero Prisma or missing-env-var errors

### `PAYMENT_WEBHOOK_SECRET` — why it wasn't created

`apps/api/src/config/env.ts` defines it as `z.string().optional()`, so the app's
startup validation (`envSchema.parse(process.env)`) succeeds with it unset.
It's only read lazily inside the `/payments/webhook` route's signature check,
which safely returns `400 Invalid webhook signature` rather than crashing
when unset. No webhook is registered against this staging service in
Razorpay, so there is nothing for this secret to validate yet.

### ⚠️ Known blocker — org policy prevents public access

`gcloud run deploy --allow-unauthenticated` **did not fully apply**. The
`xyratek.in` GCP organization has a Domain Restricted Sharing policy
(`constraints/iam.allowedPolicyMemberDomains`, locked to the org's own
customer ID) that blocks granting `allUsers` access to any resource,
org-wide — confirmed via `gcloud resource-manager org-policies describe`.
As a result **the service is currently private**: unauthenticated requests
get `403 Forbidden`. Verified functionality above by generating a
short-lived `gcloud auth print-identity-token` for testing only (deleted
immediately after use).

**This blocks connecting the Cloudflare Workers preview** (Phase 8), which
has no GCP credentials and cannot authenticate. Needs one of:
1. An org policy exception for this specific project (requires
   Organization Policy Administrator — may not be within
   `monisha@xyratek.in`'s current role; worth checking)
2. A different access pattern (signed OIDC tokens minted by the Worker, or
   a Cloud Load Balancer + Cloud Armor in front) — meaningfully more
   complex than a straightforward public Cloud Run service

## Tests completed

- Manual verification only — **no automated E2E suite exists in this repo**. Prior "E2E testing" (login/cart/checkout etc.) was done interactively via a browser automation tool, not a checked-in test suite. This should be decided on explicitly before claiming E2E coverage for Cloud Run.
- Confirmed the API's `PORT` handling is Cloud-Run-compatible by reading `apps/api/src/config/env.ts` and `apps/api/src/index.ts` (no live Cloud Run test yet, since nothing is deployed there).

## Remaining tasks

See the step-by-step plan already agreed for Phase 3 onward: enable GCP APIs → create secrets → build image via Cloud Build → deploy to Cloud Run → verify health/DB/logs → repoint Cloudflare preview only → manual page walkthrough → compare against Render.

## Cloud Run configuration (planned, not yet applied)

- CPU: 1 vCPU
- Memory: 512Mi (raise to 1Gi only if logs show memory pressure)
- Min instances: 1 (eliminates cold starts)
- Max instances: 3
- Concurrency: default (80)
- CPU allocation: default (only during request processing)

## Known issues

- No automated E2E test suite exists yet (see Tests completed).
- Prisma's query engine binary is built during the Docker image build; must ensure the Cloud Run image is built for `linux/amd64` (true by default via Cloud Build).
- `DATABASE_URL` without `?pgbouncer=true` causes "prepared statement already exists" errors — a real bug hit and fixed earlier in this project; must not be forgotten when the value is entered into Secret Manager.

## Rollback procedure

Render is never modified or stopped during this migration. To roll back at
any point: stop pointing the Cloudflare preview's `VITE_API_BASE_URL`
build-time variable at the Cloud Run URL and rebuild/redeploy the preview
worker pointing back at `https://rajadhaniyam-api.onrender.com`. No DNS,
database, master branch, or production Razorpay configuration is ever
touched by this migration, so there is nothing else to unwind.

## Safety restrictions (standing, for every future session on this migration)

- Do not merge into `master`/`main`.
- Do not modify or delete the existing Cloudflare preview deployment.
- Do not modify production DNS.
- Do not modify the production Cloudflare deployment.
- Do not change the production Razorpay webhook, or create any webhook against the Cloud Run staging service.
- Do not use production Razorpay credentials in Cloud Run staging — test-mode keys only.
- Do not stop, delete, or modify the Render deployment.
- Do not run Prisma migrations against the production database without explicit approval.
- Do not change the Supabase database schema.
- Do not print secret values in terminal output, commits, or this file — names only.
- Do not commit `.env` files, credentials, or service-account keys.
