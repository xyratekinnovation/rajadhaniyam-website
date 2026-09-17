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
| Cloudflare storefront preview | https://rajadhaniyam-storefront-preview.xyratekinnovation.workers.dev | Live — **now points at Cloud Run staging API** (as of 2026-09-17, Phase 8) |
| Cloud Run API (staging) | https://rajadhaniyam-api-staging-855749773400.asia-south1.run.app | Deployed, publicly reachable, verified healthy, **now actively serving the Cloudflare preview** — full test matrix passed (see Phase 8 below) |

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
- [x] Public-access blocker resolved (`--no-invoker-iam-check`, no org policy changed — see below)
- [x] Cloudflare preview repointed at Cloud Run API — see "Phase 8: Cloudflare Preview → Cloud Run" below
- [x] Manual page-by-page verification against Cloud Run — 13/13 test scenarios, full results below
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

### Public access — RESOLVED via `--no-invoker-iam-check` (no org policy changed)

`gcloud run deploy --allow-unauthenticated` initially **did not fully
apply**: the `xyratek.in` GCP organization has a Domain Restricted Sharing
policy (`constraints/iam.allowedPolicyMemberDomains`, locked to the org's
own customer ID) that blocks granting `allUsers` as an IAM policy binding
on any resource, org-wide. The service was private (`403 Forbidden` on
unauthenticated requests) until this was resolved.

**Investigation** (read-only, no changes) found a separate mechanism that
doesn't touch that policy at all: `constraints/run.managed.requireInvokerIam`
(a Cloud Run "managed constraint", queried via the Org Policy V2 API —
required first enabling `orgpolicy.googleapis.com` on the project, an API
enablement, not a policy change) has an **effective value of `enforce:
false`** on this project. That constraint governs whether Cloud Run
services are *allowed* to disable their own invoker-IAM-check; since it's
not enforced, they are. Unlike `--allow-unauthenticated`, disabling the
invoker check via `--no-invoker-iam-check` adds **no `allUsers` IAM
binding** — it's a separate, IAM-binding-free access-control mechanism, so
it never triggers Domain Restricted Sharing.

**Change applied** (2026-09-17):
```
gcloud run services update rajadhaniyam-api-staging \
  --region=asia-south1 --project=xyratek-websites \
  --no-invoker-iam-check
```
This updated the existing service's metadata only — **no new revision was
created** (`latestCreatedRevisionName` stayed `rajadhaniyam-api-staging-00001-44h`
throughout), and the container image/digest is unchanged.

**Verification performed**:
- `GET /health` externally, no auth header → `200 {"success":true,"data":{"status":"ok"}}`
- `GET /products` externally, no auth header → `200`, real Supabase product data
- Cloud Run logs: clean — no auth, startup, Prisma, or runtime errors; only the request log lines (including the earlier `403`s from before the change, for contrast)
- `gcloud run services describe`: confirmed CPU=1, memory=512Mi, min-instances=1, max-instances=3, concurrency=80, no always-allocated-CPU annotation, same revision, same image digest — all unchanged from the original deployment
- `gcloud run services get-iam-policy`: still an **empty policy** (`etag: ACAB`, no bindings) — confirms no `allUsers` binding exists; public access came entirely from the invoker-check-disable mechanism
- `iam.allowedPolicyMemberDomains` re-checked after the change: still `allowedValues: [C014947ex]`, byte-for-byte identical to before — **org policy was never touched**

## Phase 8: Cloudflare Preview → Cloud Run (2026-09-17)

### A. Preview configuration changed

`VITE_API_BASE_URL` — a pure **Vite build-time env var** (`apps/storefront/src/services/api/client.ts:4`, `import.meta.env["VITE_API_BASE_URL"]`), not a Wrangler `vars` entry, not a runtime binding, not hardcoded. No `.env`/`.dev.vars` file existed for the storefront and `wrangler.json` has no `vars` block — the live preview's previous value was set purely as an ad-hoc shell variable at whoever's last build. Confirmed *before* changing anything, by inspecting the actual rendered page (not the bundle): hero/category images resolved to `rajadhaniyam-storefront.onrender.com`, proving the preview was on Render.

Changed by rebuilding with the var set to the Cloud Run URL and redeploying to the **same named Worker** (`rajadhaniyam-storefront-preview`, per `wrangler.json`):
```
VITE_API_BASE_URL=https://rajadhaniyam-api-staging-855749773400.asia-south1.run.app \
  bun run --cwd=apps/storefront build:cf
bun run --cwd=apps/storefront deploy:cf-preview
```
No application source was modified — this is a pure build/deploy operation. Confirmed via `wrangler whoami` + `wrangler deployments list` that only this one Worker exists under the Cloudflare account; there is no separate "production" Cloudflare Worker for the storefront (production storefront is Render) to accidentally affect.

### B. Preview deployment result

Succeeded — `wrangler deploy` uploaded 24 changed assets, new Version ID `ffd2e4f5-d158-4a21-944c-5c91da8da5ba`, same URL (`https://rajadhaniyam-storefront-preview.xyratekinnovation.workers.dev`). `GET /` → `200`.

### C. Proof the preview now uses Cloud Run (not assumed from a 200)

Two independent checks, both after redeploy:
1. **Rendered page inspection**: hero/category image URLs now resolve to `rajadhaniyam-storefront-preview.xyratekinnovation.workers.dev` (was `rajadhaniyam-storefront.onrender.com` before) — this can only happen if the SSR data came from Cloud Run, since Cloud Run's `STOREFRONT_URL` env var is set to this exact preview URL while Render's is set to Render's own storefront URL.
2. **Cloud Run access logs**: every request in the test session below (register, login, cart, checkout, orders — real POST/PATCH/DELETE calls) appears in `rajadhaniyam-api-staging`'s own logs with matching timestamps, including real writes (`POST 201 /auth/register`, `POST 201 /checkout`).

### D. Full test matrix (13/13 scenarios)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Homepage | PASS | Real data, correct images from Cloud Run |
| 2 | Shop/product listing | PASS | |
| 3 | Product details | PASS | |
| 4 | Search/filter | N/A (pre-existing) | Search icon is a non-functional placeholder in the app itself, unrelated to this migration. Category filter (a real feature) tested separately — PASS |
| 5 | Register | PASS | `POST 201 /auth/register`, auto-logged-in after |
| 6 | Login | PASS | Explicit sign-out then sign-in re-tested separately — PASS |
| 7 | Cart | PASS | Add-to-cart, correct pricing |
| 8 | Cart quantity update | PASS | 1→2, price/badge updated correctly |
| 9 | Checkout page | PASS | Razorpay UPI/Card/Netbanking now shown as real selectable options (test-mode keys configured) — no payment was triggered, per instructions |
| 10 | Address flow | PASS | Shipping address form within checkout |
| 11 | Account page | PASS | Correct name/email shown |
| 12 | Orders page | PASS | Order #RJD32963552 (COD, ₹264) shown correctly |
| 13 | Admin access | N/A | Admin panel isn't part of this migration — `ADMIN_URL`/footer link points at Render's real admin (`https://rajadhaniyam-admin.onrender.com`); this preview build's `VITE_ADMIN_URL` wasn't set, so the *footer link* falls back to `localhost:4001` on this specific preview build — cosmetic, pre-existing, unrelated to the API migration |

A real COD test order was placed to verify the full write path (checkout → order creation → stock decrement), then **cleaned up immediately after** (stock restored, order and test customer account deleted) — the same practice used throughout this project's earlier phases. No Razorpay payment was made.

### E. API errors

**None.** Every request across the entire ~3-minute test session (checked via full network log, not sampled) returned 2xx. Zero console errors in the browser throughout.

### F. Cloud Run logs/metrics observed

Logs show the complete, correctly-ordered request sequence for every action taken (register → login → cart → checkout → orders), each real mutation preceded by a successful `OPTIONS` CORS preflight (204) — direct proof CORS, auth headers, and cookie/session handling all work correctly cross-origin (Worker origin → Cloud Run origin). No 4xx/5xx anywhere in the logs.

`gcloud run revisions describe` showed `desiredReplicas: 1` throughout — the min-instance stayed warm for the whole session, so **no cold starts occurred** during testing (a direct, observed benefit of `min-instances: 1` vs. Render's free-tier behavior this migration set out to evaluate). Detailed CPU/memory time-series graphs weren't pulled (no straightforward `gcloud` CLI subcommand for that; would need the Cloud Console UI or a raw Monitoring API call) — not attempted, since the qualitative signal (zero errors, zero latency spikes, single warm instance) already answered the question this test was checking. No scaling configuration was changed.

### G. Rollback procedure (documented, not executed)

Reversible in one command, no DNS or Render change involved:
```
VITE_API_BASE_URL=https://rajadhaniyam-api.onrender.com \
  bun run --cwd=apps/storefront build:cf
bun run --cwd=apps/storefront deploy:cf-preview
```
This rebuilds and redeploys the same named Worker pointing back at Render. The preview's URL (`*.workers.dev`, Cloudflare-managed) never changes either way.

### H. Git status

No application source changed — this phase was pure build/deploy operations (`build:cf` + `wrangler deploy`) plus this documentation update. `git status` on `migration/cloudflare-storefront` was clean before this doc edit.

## Tests completed

- Manual verification only — **no automated E2E suite exists in this repo**. Prior "E2E testing" (login/cart/checkout etc.) was done interactively via a browser automation tool, not a checked-in test suite. This should be decided on explicitly before claiming E2E coverage for Cloud Run.
- Confirmed the API's `PORT` handling is Cloud-Run-compatible by reading `apps/api/src/config/env.ts` and `apps/api/src/index.ts`.
- **Phase 8 (2026-09-17)**: full 13-scenario manual test matrix against Cloudflare Preview → Cloud Run Staging → Supabase, all passing or correctly N/A. See "Phase 8" section above for the complete breakdown.

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

## Phase 9: Razorpay TEST verification + production readiness inspection (2026-09-17)

### A. Razorpay implementation — how it actually works

Full flow: **Storefront → `POST /checkout` → Razorpay order created → Checkout.js opens client-side → user pays → `POST /payments/verify` (HMAC signature check) → DB marked paid → (optional) `POST /payments/webhook` as a backup path.**

- `POST /checkout` (`apps/api/src/modules/orders/orders.routes.ts`, `orders.service.ts createOrder`) — creates `Order` + `OrderItem`s + a `Payment` row (`status: PENDING`) in one Prisma transaction, decrements `ProductVariant.stock`. If the order is online-payment (not COD), it then calls `createRazorpayOrder()` and returns a `RazorpayCheckoutPayload` (`keyId, orderId, amount, currency, prefill, ...`) to the browser. The Key ID is sent to the browser by design — Razorpay's own architecture, not a leak.
- `openRazorpayCheckout()` (`apps/storefront/src/lib/razorpay.ts`) — loads `checkout.razorpay.com/v1/checkout.js`, opens the modal. Success resolves with `{razorpay_payment_id, razorpay_order_id, razorpay_signature}`; **dismissing the modal rejects with `Error("Payment cancelled")`**, giving the frontend a reliable cancel signal.
- `POST /payments/verify` (`payments.routes.ts` → `payments.service.ts verifyCheckoutPayment`) — the **primary path that marks an order paid**. Re-fetches the order, confirms the Razorpay order ID matches, verifies `HMAC_SHA256(razorpayOrderId|razorpayPaymentId, keySecret)` against the client-supplied signature using `timingSafeEqual`, then calls `markPaymentPaid`. This does **not** depend on the webhook succeeding or even existing.
- `POST /payments/webhook` — a secondary/backup path. Verifies `x-razorpay-signature` against the raw body using `PAYMENT_WEBHOOK_SECRET`; on `payment.captured` calls the same `markPaymentPaid` (idempotent — checks `paymentStatus !== "paid"` first), on `payment.failed` calls `markPaymentFailed`. Returns `{handled:false}` for anything it can't match, which stops Razorpay's retry loop.
- `GET /payments/:orderId/status` — simple read of `paymentStatus`/`status`.
- **Cancelled checkout is not auto-cleaned**: `checkout.tsx`'s submit handler catches the `openRazorpayCheckout` rejection, shows an error, and returns — the `Order`/`Payment` rows stay `PENDING`/`PENDING` with no backend call. Not a bug in the payment-security sense (a pending order is never treated as paid), just means abandoned checkouts accumulate as pending orders unless cleaned up separately.

### B. Razorpay credential status on Cloud Run staging — ⚠️ BLOCKED

Checked via `gcloud secrets versions access` piped straight into a prefix match (`rzp_test_` vs `rzp_live_`) so no key value was ever printed or logged.

| Secret | Exists? | Versions | Mode |
|---|---|---|---|
| `PAYMENT_PROVIDER_KEY` | Yes | 1 | **LIVE** (`rzp_live_...` prefix) |
| `PAYMENT_PROVIDER_SECRET` | Yes | 1 | Not independently checked — Razorpay always pairs Key ID/Secret mode, so the Key ID result is conclusive |
| `PAYMENT_WEBHOOK_SECRET` | No | — | N/A (intentional, see Phase 7 note above) |

**This is a LIVE credential, not TEST**, despite this doc's own "Environment variables" section above stating it should be TEST-mode-only for staging. Per standing instructions, Phase 9D (test payment) and 9E (failure/cancel test) were **not attempted** — no payment of any kind was made against these credentials in this phase. Phase 8's checkout-page test (row 9 in that table) only reached the payment-method-selection screen and never submitted a payment, so no live charge occurred at any point in this migration.

**To unblock**: replace both secret values with Razorpay **Test Mode** credentials (Razorpay Dashboard → Test Mode toggle → Settings → API Keys → generate test Key ID/Secret, `rzp_test_...` prefix) by adding a new secret version to the existing `PAYMENT_PROVIDER_KEY`/`PAYMENT_PROVIDER_SECRET` Secret Manager secrets (Cloud Run reads `:latest`, so no redeploy needed once the new version is added).

### C. Webhook strategy (code-inspection only, no live test required)

1. Signature verification alone (`/payments/verify`) is sufficient to mark an order paid — confirmed above.
2. The webhook is **not required** for the primary success path.
3. The app can be safely TEST-mode-verified without any webhook configured (as already planned — `PAYMENT_WEBHOOK_SECRET` isn't set on staging).
4. Staging webhook URL, for reference only — **not created/registered**: `https://rajadhaniyam-api-staging-855749773400.asia-south1.run.app/payments/webhook`

### D–F. Test payment / verification / failure-cancel test

**Not performed.** Blocked by finding B (LIVE credentials on staging). No test data was created in this phase.

### G. Current production infrastructure (read-only inspection)

- **Storefront**: Render, Docker (`apps/storefront/Dockerfile`), `https://rajadhaniyam-storefront.onrender.com` — no custom domain configured (`render.yaml` has no custom domain block; `docs/DEPLOYMENT.md`'s "Custom domain" section is written as a future TODO — `rajadhaniyam.com` "once ready", not yet done).
- **Admin**: Render, static build, `https://rajadhaniyam-admin.onrender.com`.
- **API**: Render, Docker, `https://rajadhaniyam-api.onrender.com` — CORS origins are `STOREFRONT_URL` + `ADMIN_URL` + `EXTRA_CORS_ORIGINS` (currently includes the Cloudflare preview origin as a temporary addition for this migration; see `render.yaml` comment).
- **DNS**: not managed anywhere yet — no custom domain exists in production, so there's no DNS delegation to change as part of a future migration (this simplifies the eventual cutover: it's a first-time DNS setup, not a migration of existing records).
- **Cloudflare**: only the preview Worker (`rajadhaniyam-storefront-preview`, this branch) exists. No production Cloudflare Worker, zone, or DNS configuration exists yet.
- **Razorpay production webhook**: `docs/DEPLOYMENT.md` documents the intended webhook URL as `https://rajadhaniyam-api.onrender.com/payments/webhook`, to be created "after you create the webhook" in the Razorpay Dashboard — this doc cannot confirm from code alone whether that webhook has actually been registered on Razorpay's side (that's dashboard-side state, not visible here).
- **Production env vars** (names only): `NODE_ENV`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `STOREFRONT_URL`, `ADMIN_URL`, `EXTRA_CORS_ORIGINS`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET`, `PAYMENT_WEBHOOK_SECRET` (all `render.yaml`, `sync: false` ones populated directly in the Render dashboard, never committed).

### H. Proposed production migration plan (NOT executed — planning only)

Target: `Client domain → Cloudflare (production Worker) → Cloud Run (production API) → Supabase`, Razorpay LIVE → Cloud Run production API, Render kept as rollback during stabilization.

1. Create a **separate** Cloud Run service `rajadhaniyam-api-production` (never reuse the staging service) in the same project/region, deployed from a reviewed/tagged image (not directly from a staging build).
2. Create dedicated production secrets in Secret Manager (`PAYMENT_PROVIDER_KEY`/`SECRET` = real LIVE Razorpay keys, entered directly by the client/owner, never by the assistant) — kept fully separate from the staging secrets used in this migration.
3. Deploy a **new, separate** Cloudflare Worker for production storefront (not the existing preview Worker), built with `VITE_API_BASE_URL` pointed at the new production Cloud Run URL.
4. Point the client's real domain's DNS at Cloudflare (first-time setup, since no custom domain exists yet — see G above), then at the production Worker.
5. Update production API CORS (`STOREFRONT_URL`/`EXTRA_CORS_ORIGINS`) to the new domain.
6. Register the Razorpay production webhook against the new Cloud Run production API URL (only after cutover is confirmed stable) — do not touch the existing Render-pointed webhook until ready to cut over.
7. Run the same manual test matrix used in Phase 8 against production Cloud Run before sending real traffic.
8. Keep Render running, untouched, as instant rollback (swap DNS/Worker var back) until the new stack has proven stable for an agreed stabilization period.
9. Only after stabilization: decommission the Render services and the old Razorpay webhook.

Explicitly not done in this phase: no production Cloud Run service created, no DNS changed, no production Cloudflare Worker created, no Razorpay production webhook changed.

### I. Production readiness checklist

**Infrastructure**
- [ ] Dedicated production Cloud Run service (separate from staging)
- [ ] Min-instances sized for real traffic (staging used 1; revisit for production load)
- [ ] Production secrets created independently of staging secrets
- [ ] IAM reviewed for production service (who can deploy/view logs/access secrets)
- [ ] Logging/alerting configured (Cloud Monitoring alert policies — none exist yet for staging or would exist for production)

**Application**
- [ ] Auth, products, cart, checkout, orders, admin all re-verified against production Cloud Run (same matrix as Phase 8)
- [ ] Supabase Storage URLs/buckets confirmed correct for production

**Payments**
- [ ] Razorpay LIVE credentials entered directly by the client (never via assistant) into production secrets only
- [ ] Production webhook registered and its `PAYMENT_WEBHOOK_SECRET` set
- [ ] Failure/cancel behavior re-verified in LIVE mode conceptually (via Razorpay's own live-mode test tools/small real transaction under the client's control, not this assistant's)
- [ ] Refund/cancel-order operational process defined (not currently implemented in code beyond order status — confirm if a refund flow is needed)

**Production deployment**
- [ ] Dedicated production Cloudflare Worker (not the preview one)
- [ ] Client domain DNS pointed at Cloudflare
- [ ] SSL/TLS via Cloudflare (automatic once DNS is proxied)
- [ ] CORS updated to the final domain
- [ ] Session/cookie config re-verified cross-origin at the new domain

**Rollback**
- [ ] Documented one-step DNS/Worker-var rollback to Render (pattern already proven in Phase 8's rollback procedure)
- [ ] Razorpay webhook rollback plan (keep old webhook active until new one is proven)

**Client handover**
- [ ] This document + a plain-language runbook handed to the client
- [ ] Credential transfer process agreed (client enters their own production secrets directly, not via the assistant)
- [ ] Admin training / support process defined

### J. Documentation

This section was committed and pushed to `migration/cloudflare-storefront` only, per standing instructions — not merged to `master`.

## Phase 10: Production infrastructure preparation (2026-09-17)

Inspection + planning only — nothing in this phase was deployed, changed, or created. Razorpay TEST payment testing remains deferred to final QA, per instructions.

### A. Current production architecture (confirmed)

```
??? domain (see B) ──X── (not currently pointed at this project at all)

Render:
  Storefront (Docker)  https://rajadhaniyam-storefront.onrender.com
  Admin (static)        https://rajadhaniyam-admin.onrender.com
  API (Docker)          https://rajadhaniyam-api.onrender.com  ──► Supabase Postgres/Storage
                                                                ──► Razorpay (LIVE, per render.yaml `sync:false` secrets — not inspected, no values touched)
```

### B. Production domain / DNS findings — ⚠️ requires client clarification

The codebase itself is inconsistent about which domain is the real one:
- `docs/DEPLOYMENT.md` and `docs/DEVELOPMENT_ROADMAP.md` both refer to `rajadhaniyam.com` as the eventual custom domain.
- The storefront's own footer and contact page (`apps/storefront/src/components/site/Footer.tsx`, `apps/storefront/src/routes/contact.tsx`) show the contact email as `care@rajadhaniyam.in`.

Read-only public DNS/HTTP lookups (no modification, standard public queries) were run against both to determine ground truth:

| Domain | DNS | Finding |
|---|---|---|
| `rajadhaniyam.com` | Resolves — `A` → `76.223.105.230`, `13.248.243.5` | **Currently serving a live, different website** — HTTP response headers identify it as a **GoDaddy Website Builder** site (`Content-Security-Policy: ... godaddy.com`, `img1.wsimg.com` asset CDN, `X-SiteId: ap-south-1`). This is not Render, not parked, not blank — it's an existing live site. |
| `rajadhaniyam.com` nameservers | `ns65.domaincontrol.com`, `ns66.domaincontrol.com` | GoDaddy DNS (not Cloudflare) |
| `rajadhaniyam.com` MX | `smtp.secureserver.net` (pri 0), `mailstore1.secureserver.net` (pri 10) | **Live GoDaddy-hosted email** on this domain |
| `rajadhaniyam.com` TXT | `v=spf1 include:spf.em.secureserver.net ?all` | SPF record tied to that GoDaddy email — **must not be touched** without a full replacement SPF record, or outbound mail from this domain will start failing |
| `rajadhaniyam.in` | `NXDOMAIN` (does not resolve at all) | Either not registered, or registered with no DNS configured |

**This needs your confirmation before any further DNS planning**: is `rajadhaniyam.com` the intended production domain (meaning the current GoDaddy site would need to be replaced/redirected as part of go-live, and its existing email must be preserved), is `rajadhaniyam.in` the intended domain (meaning it needs to be registered/configured from scratch), or is a different domain entirely planned? I have not guessed — this is reported as "not determined" until you confirm.

Other findings:
3. **Frontend hosting**: Render, Docker (`rajadhaniyam-storefront.onrender.com`) — no domain currently points here.
4. **Production API URL**: `https://rajadhaniyam-api.onrender.com`.
9. **Current Render services**: `rajadhaniyam-api`, `rajadhaniyam-storefront` (both `plan: free`, Docker), `rajadhaniyam-admin` (static). All three defined in `render.yaml`.
10-11. **API config / CORS**: `STOREFRONT_URL` + `ADMIN_URL` + `EXTRA_CORS_ORIGINS` (currently temporarily includes the Cloudflare preview origin — see the note in `render.yaml`, flagged for removal after this migration).
12. **Storefront config**: `VITE_API_BASE_URL=https://rajadhaniyam-api.onrender.com`, `VITE_ADMIN_URL=https://rajadhaniyam-admin.onrender.com` (build-time only).
13-14. **Razorpay production config**: `docs/DEPLOYMENT.md` documents the intended webhook URL as `https://rajadhaniyam-api.onrender.com/payments/webhook` — **whether this webhook is actually registered on Razorpay's side cannot be determined from the repository**; that's dashboard-side state only visible with Razorpay Dashboard access.
15. **Supabase project**: production `render.yaml` secrets (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`) are separate `sync:false` entries from the staging ones used in Cloud Run — **whether they point at the same Supabase project as staging is not determined from the repo alone** (values were never inspected, by design); this should be confirmed before cutover to avoid staging/production data crossing.
16. **Production env var names**: `NODE_ENV`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `STOREFRONT_URL`, `ADMIN_URL`, `EXTRA_CORS_ORIGINS`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET`, `PAYMENT_WEBHOOK_SECRET` (per `render.yaml`).

### C. Production Cloud Run design (proposed, not deployed)

Reusing the staging configuration as a starting point, since staging has run cleanly with it (zero errors across the full Phase 8 test session, one warm instance, no cold starts, no memory-pressure signals in logs):

| Setting | Staging (proven) | Production (proposed) |
|---|---|---|
| Service name | `rajadhaniyam-api-staging` | `rajadhaniyam-api-production` (separate service, never reuse staging) |
| Region | `asia-south1` | `asia-south1` |
| CPU | 1 vCPU | 1 vCPU (unchanged) |
| Memory | 512Mi | 512Mi initially (raise only if real traffic shows pressure) |
| Min instances | 1 | 1 (avoids cold starts, same rationale as staging) |
| Max instances | 3 | 3 initially — revisit once real order volume is known |
| Concurrency | 80 (default) | 80 (default) |
| CPU allocation | request-based | request-based |
| Image | shared Artifact Registry repo `rajadhaniyam-api` | same repo, but production should deploy a specific reviewed/tagged digest, not "whatever staging last built" |

No deployment performed. Detailed CPU/memory time-series still hasn't been pulled from Cloud Monitoring (same gap noted in Phase 8F) — worth doing once there's real traffic to size against, not blocking for initial launch.

### D. Production secrets plan (not created)

Current staging secrets are plain-named (`DATABASE_URL`, `PAYMENT_PROVIDER_KEY`, etc.) with no environment prefix — they're scoped only by which Cloud Run service references them. To avoid any risk of a production service accidentally reading a staging secret (or vice versa), production secrets should be **entirely separate Secret Manager entries**, not new versions of the existing ones:

| Category | Staging secret (existing) | Production secret (proposed name) |
|---|---|---|
| DB connection | `DATABASE_URL` | `DATABASE_URL_PRODUCTION` |
| Supabase service key | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION` |
| Auth | `JWT_SECRET` | `JWT_SECRET_PRODUCTION` |
| Session | `SESSION_SECRET` | `SESSION_SECRET_PRODUCTION` |
| Razorpay key | `PAYMENT_PROVIDER_KEY` | `PAYMENT_PROVIDER_KEY_PRODUCTION` |
| Razorpay secret | `PAYMENT_PROVIDER_SECRET` | `PAYMENT_PROVIDER_SECRET_PRODUCTION` |
| Razorpay webhook | *(not created for staging)* | `PAYMENT_WEBHOOK_SECRET_PRODUCTION` |

Rationale for a `_PRODUCTION` suffix over a path-style prefix (`rajadhaniyam/production/...`): Secret Manager secret IDs are flat (no real path hierarchy in the free-tier API surface used here), and a suffix keeps the existing staging secret names/IAM bindings completely untouched — zero risk to the working staging setup. **Not created yet** — this is a naming plan only, and production secret values must be entered directly by the client/owner (LIVE Razorpay keys, production DB credentials), never by the assistant.

### E. Production Cloudflare Worker design (proposed, not deployed)

Inspected the existing preview Worker config (`apps/storefront/wrangler.json`, `apps/storefront/package.json`):
1. **Worker name**: proposed `rajadhaniyam-storefront-production` (the existing `wrangler.json`'s `name` field is hardcoded to `rajadhaniyam-storefront-preview` — production needs its **own** `wrangler.json` or a `--name` override at deploy time, not a shared config).
2. **Build command**: same as preview — `bun run --cwd=apps/storefront build:cf` (`vite build`, no code change needed).
3. **Deploy command**: `wrangler deploy --name rajadhaniyam-storefront-production --config <production-wrangler-config>` (or a second config file, e.g. `wrangler.production.json`).
4. **`VITE_API_BASE_URL` handling**: unchanged mechanism (pure Vite build-time var) — set to the future `rajadhaniyam-api-production` Cloud Run URL at build time.
5. **Production env vars**: same shape as preview (`VITE_API_BASE_URL`, `VITE_ADMIN_URL`) — values differ (point at production API/admin instead of staging).
6. **Custom domain/route**: once DNS is confirmed (see B), Cloudflare "Custom Domains" (or a Worker Route) attaches the Worker to the real domain — not needed until DNS design is finalized.
7. **Reuse**: yes — the storefront's Cloudflare build output (`cloudflare-module` Vite preset) is environment-agnostic; only the Worker name, config file, and build-time env vars need to differ.
8. **Must remain different between preview and production**: Worker name, `wrangler.json`/config file, `VITE_API_BASE_URL`/`VITE_ADMIN_URL` values, and (once attached) the custom domain route. The `workers_dev: true` preview subdomain should likely stay off (or be a separate concern) for the production Worker once a real domain is attached.

### F. DNS cutover plan (design only — nothing changed)

Current (confirmed, see B): `rajadhaniyam.com` → GoDaddy nameservers → GoDaddy Website Builder (unrelated live site) + GoDaddy email (MX/SPF).

Target, once the domain question in B is resolved:
```
Client domain ──► Cloudflare (nameservers changed at registrar, or DNS-only mode)
                     └──► CNAME/route ──► Production Worker
                     └──► (optional) api.<domain> ──► Cloud Run production custom domain mapping
```
- **A/CNAME records**: root domain → Cloudflare (via Cloudflare's own onboarding, either full nameserver delegation or CNAME setup depending on plan); `www` → same Worker (redirect or serve directly, decide one canonical host and 301 the other).
- **SSL/TLS**: automatic via Cloudflare once proxied — no manual certificate work needed.
- **API hostname**: optional; the storefront can call Cloud Run's own `*.run.app` URL directly (as staging does), or a custom `api.<domain>` can be mapped to Cloud Run for a cleaner CORS/branding story — not required for functionality.
- **Records that must NOT be touched**: the MX records (`smtp.secureserver.net`, `mailstore1.secureserver.net`) and the SPF TXT record found in B, **if** `rajadhaniyam.com` is confirmed as the domain and its GoDaddy email is still in active use — any DNS/nameserver migration must explicitly re-create these records at the new provider (Cloudflare) rather than drop them. Full enumeration of all existing records (including any DKIM/DMARC TXT entries not checked here) should be done via the GoDaddy DNS dashboard directly before any nameserver change, since only MX/SPF/NS were queried in this inspection.

### G. Rollback plan

- **Storefront/Worker-level rollback** (same proven pattern as Phase 8's rollback): rebuild the production Worker with `VITE_API_BASE_URL` pointed back at `https://rajadhaniyam-api.onrender.com` and redeploy to the same Worker name — one command, no DNS change needed if DNS already points at Cloudflare→Worker (Cloudflare stays the front door; only the Worker's backend target changes).
- **DNS-level rollback** (only if nameservers were already moved to Cloudflare before a problem is found): point the Cloudflare route back at Render's origin instead of the Worker, or revert nameservers at the registrar — slower, so the Worker-level rollback above should be tried first for any application-level issue.
- **Render must stay running and untouched** throughout stabilization — this is already true today (nothing in this migration has stopped or modified it).
- Rollback does **not** mean reverting to the pre-existing GoDaddy site found in B — that's a separate decision for the client, outside this migration's scope.

### H. Cutover sequence (documented, not executed)

1. Resolve the domain question in B with the client.
2. Deploy `rajadhaniyam-api-production` Cloud Run service (per C) from a specific reviewed image digest.
3. Create production secrets (per D), populated directly by the client/owner.
4. Verify production Cloud Run in isolation (`/health`, `/products`, logs) using its own `*.run.app` URL — before any DNS/domain involvement.
5. Build and deploy the production Cloudflare Worker (per E), initially reachable only via its own `*.workers.dev` URL, same as the preview pattern — verify end-to-end against production Cloud Run.
6. Re-run the full manual test matrix (Phase 8's 13 scenarios + Phase 10H's expanded checklist) against production Worker → production Cloud Run.
7. Register the Razorpay production webhook against the production Cloud Run URL — only after step 6 passes, and only with the client's own LIVE credentials already in place server-side.
8. DNS cutover (per F) — last step, only after 2-7 are all verified green.
9. Immediate post-cutover smoke test on the live domain (homepage, login, cart, checkout, one COD order, one small real Razorpay payment under the client's control).
10. Rollback window: keep Render fully running and the pre-cutover DNS state documented for a defined stabilization period (e.g. 1-2 weeks) before considering decommissioning anything.
11. Only after stabilization: decommission Render services and any now-unused resources.

### I. Final QA checklist

**Customer**: homepage, navigation, category/shop listing, product details, search, register, login, cart, address, checkout, COD order, Razorpay TEST payment, Razorpay TEST payment failure, Razorpay TEST payment cancellation, order confirmation, order history, mobile viewport, desktop viewport.

**Admin**: login, dashboard, product management, order management, customer data view, order status transitions.

**Infrastructure**: Cloud Run (health, logs, scaling), Cloudflare (Worker deploy, routing), Supabase (DB + Storage connectivity), DNS resolution, SSL/TLS validity, CORS (preflight + real requests cross-origin), log visibility, baseline performance/cold-start behavior, rollback drill (actually exercised once, not just documented).

**Payment**: Razorpay TEST payment success, signature verification, webhook behavior (if configured), payment failure handling, payment cancellation handling, payment/order status consistency after each of the above.

### J. Client handover preparation

Documentation to prepare (no credentials inside any of it):
- Live website URL and admin URL
- Admin usage guide (day-to-day: products, orders, customers)
- Infrastructure overview (this document, simplified to a client-facing summary)
- Deployment/runbook (how to redeploy each piece, who has access)
- Backup/rollback procedure
- Support process (who to contact for infra vs. application issues)
- Domain ownership confirmation (registrar account access, per the open question in B)
- Third-party services list (Supabase, Razorpay, Cloudflare, Google Cloud, Render-during-stabilization) with account-ownership noted for each
- Credential transfer procedure (client enters/rotates their own secrets directly; the assistant never holds or transmits them)

### K. Remaining blockers

1. **Domain identity unresolved** (`rajadhaniyam.com` vs `rajadhaniyam.in` vs other) — blocks all DNS/Cloudflare production planning beyond what's documented here.
2. **`rajadhaniyam.com` currently serves a live, unrelated GoDaddy site with active email** — if this is the intended domain, the client needs to decide how the existing site/email is handled during cutover.
3. **Razorpay staging credentials are still LIVE, not TEST** (Phase 9B, unresolved) — blocks Phase 9D/9E test-payment verification, intentionally deferred to final QA per this phase's instructions, but still open.
4. Whether production Supabase is the same project as staging is not confirmed (values not inspected).
5. Whether a Razorpay production webhook is actually registered today is not confirmed (dashboard-only visibility).

### L. Documentation

This section committed and pushed to `migration/cloudflare-storefront` only — not merged to `master`.

## Phase 11: Domain confirmed (rajadhaniyam.in) — production preparation (2026-09-17)

**Confirmed by the client**: the production domain for this project is **`rajadhaniyam.in`**, purchased specifically for Rajadhaniyam. `rajadhaniyam.com` is explicitly a **different, unrelated site and must never be touched** — no DNS, hosting, email, or any other change to it, ever, as part of this project.

### A. `rajadhaniyam.in` registration/DNS findings

Checked via public RDAP (the standard successor to WHOIS, an authenticated registry lookup — read-only, no changes) and public DNS:

1. **Registered?** Yes.
2. **Registrar**: GoDaddy (IANA registrar ID 146).
3. **Registrant**: "Xyratek innovation private limited", Tamil Nadu, IN — matches the client's own company, confirming this is genuinely the client's domain.
4. **Registered on**: 2026-09-15 (2 days before this check), expires 2027-09-15.
5. **Current nameservers**: `ns41.domaincontrol.com`, `ns42.domaincontrol.com` — **GoDaddy's own DNS**, not yet Cloudflare.
6. **DNS records**: none observed yet — a direct `nslookup`/public-DNS-over-HTTPS query for A/NS/MX/TXT/SOA all returned NXDOMAIN at the authoritative `.in` registry level, even though RDAP confirms nameservers are associated. This is consistent with a **very recently registered domain (2 days old) where propagation to the live DNS resolution path hasn't fully completed yet** — not an error, just early registration state. Confirm current status directly in the GoDaddy DNS dashboard before relying on this.
7. **MX/email records**: none found (consistent with #6 — nothing has propagated/been configured yet).
8. **Cloudflare already configured?** No — nameservers are still GoDaddy's default ones; Cloudflare has not been added to this domain yet.
9. **Domain status codes** (from RDAP): `client delete/renew/transfer/update prohibited`, `add period` — all standard GoDaddy defaults for a brand-new registration, not a red flag.

No changes were made to this domain or its DNS during this check — only public, read-only lookups.

### B. Supabase staging/production relationship

- **Staging's Supabase project**: Cloud Run staging's `DATABASE_URL` secret was checked the same careful way as the Razorpay Key ID in Phase 9 — only the **non-secret project reference** was extracted (the identifier segment of the pooled-connection username, e.g. the `<ref>` in `postgres.<ref>@...`), the password/host were never printed or logged. Staging's project ref: **`okoalheebdrszwkiombn`**. This alone is not sensitive (it's the same identifier visible in the Supabase dashboard URL) and lets you visually compare it against Render's production `DATABASE_URL` yourself.
- **Render production's Supabase project**: **not determined** — this session has no access to Render's dashboard or environment variables (no Render API/CLI credentials configured here), so production's project ref cannot be checked or compared from this side.
- **Are staging and production on the same database?** Not determined from this session for the reason above. **Please compare `okoalheebdrszwkiombn` against the project ref visible in Render's `DATABASE_URL` yourself** — if they match, staging has been reading/writing the production database this entire time (worth knowing given the test order created and cleaned up in Phase 8).
- **Are separate projects practical?** Yes — Supabase's free/low tiers support multiple projects; a dedicated staging project would fully eliminate any risk of staging tests touching production data, at the cost of needing to seed/maintain separate schema+data in a second project.
- **Consequences of sharing the production DB for staging**: any staging test (including future Razorpay TEST payments once unblocked) would create real rows in the production database — stock decrements, orders, customer records — requiring careful manual cleanup every time, exactly as was done in Phase 8. Not currently a correctness bug, but an ongoing operational risk as long as it continues.
- Per instructions, **no Supabase configuration was changed** — this is a finding only.

### C. Production Cloud Run design (finalized proposal, not deployed)

- **Service name**: `rajadhaniyam-api-production`
- **Project**: `xyratek-websites`, region `asia-south1`
- **Image**: reuse the already-verified staging image — `asia-south1-docker.pkg.dev/xyratek-websites/rajadhaniyam-api/rajadhaniyam-api@sha256:2d2861c7f81b52cdbfa306004bfd286404f2e69f0726d5d550793905647c2568` (same digest documented in the Artifact Registry section above). **No rebuild** — this exact image already ran cleanly through the full Phase 8 test matrix.
- **CPU**: 1 vCPU · **Memory**: 512Mi · **Min instances**: 1 · **Max instances**: 3 · **Concurrency**: 80 (default) · **CPU allocation**: request-based — identical to staging's proven config (see Phase 10C rationale).
- **Runtime service account**: proposal — use the same project default (`855749773400-compute@developer.gserviceaccount.com`) unless the client wants a dedicated least-privilege service account for production (cleaner separation, optional hardening, not required to function).
- **Required Secret Manager secrets**: `DATABASE_URL_PRODUCTION`, `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`, `JWT_SECRET_PRODUCTION`, `SESSION_SECRET_PRODUCTION`, `PAYMENT_PROVIDER_KEY_PRODUCTION`, `PAYMENT_PROVIDER_SECRET_PRODUCTION`, `PAYMENT_WEBHOOK_SECRET_PRODUCTION` (naming plan from Phase 10D) — **none created yet**.
- **Required non-secret env vars**: `NODE_ENV=production`, `STOREFRONT_URL=https://rajadhaniyam.in` (once live), `ADMIN_URL` (TBD — keep on Render or migrate separately, client's call), `SUPABASE_URL` (currently **not set at all on staging** — see note below, needs deciding for production).
- **Note**: staging's own Cloud Run config does not currently set `SUPABASE_URL` (confirmed via `gcloud run services describe` — it's absent from both secrets and non-secret env vars). Since `SUPABASE_URL` is `optional()` in `apps/api/src/config/env.ts`, the app starts fine without it, but this should be double-checked against what actually needs it (Storage operations) before assuming production can skip it too.

### D. Production secret plan

Unchanged from the Phase 10D naming plan (`_PRODUCTION` suffix on each existing secret name, entirely separate Secret Manager entries from staging's) — reconfirmed here, still **not created**. Values (DB credentials, Supabase service key, Razorpay LIVE keys) must be entered directly by the client, never requested by or shown to the assistant.

### E. Production Cloudflare Worker design (finalized proposal, not deployed)

1. **Reuse from preview**: the build pipeline (`bun run --cwd=apps/storefront build:cf`, the `cloudflare-module` Vite preset) is environment-agnostic and fully reusable as-is.
2. **Must be production-specific**: Worker name, its own `wrangler.json`/config file (the existing one is hardcoded to `rajadhaniyam-storefront-preview`), and all build-time env var values.
3. **`VITE_API_BASE_URL`**: `https://rajadhaniyam-api-production-<hash>.asia-south1.run.app` (exact hostname known only after the production Cloud Run service is actually created — Cloud Run assigns it).
4. **`STOREFRONT_URL`** (set on the API side, not the Worker): `https://rajadhaniyam.in`.
5. **Production API URL**: the production Cloud Run service's own URL (see #3) unless/until a custom `api.rajadhaniyam.in` mapping is added.
6. **Custom domain for `rajadhaniyam.in`**: attached via Cloudflare "Custom Domains" once the domain's nameservers point at Cloudflare (see F) — not possible until then.
7. **Build/deploy commands**: `VITE_API_BASE_URL=<prod-cloud-run-url> VITE_ADMIN_URL=<prod-admin-url> bun run --cwd=apps/storefront build:cf` then `wrangler deploy --name rajadhaniyam-storefront-production --config wrangler.production.json` (new config file, not yet created).
8. **Cloudflare env vars/secrets**: none required beyond the build-time Vite vars above — no Wrangler `vars`/`secrets` block exists today and none are needed for this app's current design.

Not deployed. `rajadhaniyam.in` not attached to anything yet.

### F. Production DNS plan for `rajadhaniyam.in`

Current (per A): GoDaddy nameservers, no records configured yet, nothing live.

Target:
```
rajadhaniyam.in ──► Cloudflare nameservers (registrar-level NS change at GoDaddy)
                       └──► root domain ──► Production Worker (via Cloudflare Custom Domain)
                       └──► www.rajadhaniyam.in ──► redirect to root (or same Worker, one canonical host)
```
- **A/CNAME**: once nameservers point at Cloudflare, the root domain attaches to the Worker via Cloudflare's own "Custom Domains" feature (Cloudflare manages the proxied record automatically) — no manual A/CNAME record needed for the Worker itself.
- **`www.rajadhaniyam.in`**: recommend a single canonical host (root, no `www`, matching the pattern already used for the `.com` reference in the docs) with a redirect rule for `www` → root, set up in Cloudflare once the zone exists.
- **SSL/TLS**: automatic via Cloudflare once the zone is active — no manual certificate work.
- **API hostname**: optional `api.rajadhaniyam.in` → Cloud Run production custom domain mapping; not required, the storefront can call the `*.run.app` URL directly as staging already does.
- **Records that must not be touched**: **none currently exist on `rajadhaniyam.in`** (per A) — unlike `.com`, there is no existing email or third-party service on this domain to preserve, which makes this a clean first-time setup. (`rajadhaniyam.com`'s MX/SPF records remain completely out of scope for this project, as instructed.)

Nothing changed. This is a plan only.

### G. Razorpay production plan

- Staging remains on the credentials found in Phase 9B (currently LIVE, flagged, unresolved) — **not touched in this phase**, and Razorpay TEST verification stays deferred to final QA per this phase's instructions.
- **Production webhook URL, once the production Cloud Run service exists**: `https://<rajadhaniyam-api-production-service-url>/payments/webhook` (exact hostname known only after deployment), or `https://api.rajadhaniyam.in/payments/webhook` if the optional custom API hostname from F is set up.
- **Not created, not changed.** No LIVE credentials requested or used.

### H. Complete production cutover sequence

| # | Step | Reversible? |
|---|---|---|
| 1 | Deploy `rajadhaniyam-api-production` Cloud Run service (reusing the verified image digest) | Yes — delete the service, zero impact elsewhere |
| 2 | Create `_PRODUCTION`-suffixed secrets, populated by the client directly | Yes — delete the secrets |
| 3 | Verify production Cloud Run in isolation via its own `*.run.app` URL (`/health`, `/products`, logs) | N/A (read-only verification) |
| 4 | Build & deploy `rajadhaniyam-storefront-production` Worker, reachable only via its own `*.workers.dev` URL first | Yes — delete/redeploy the Worker |
| 5 | Attach `rajadhaniyam.in` to Cloudflare (registrar nameserver change at GoDaddy) | **Harder to reverse quickly** — NS changes can take time to propagate back; this is the first meaningfully "sticky" step |
| 6 | Attach the domain to the production Worker via Cloudflare Custom Domains | Yes, while nameservers already point at Cloudflare |
| 7 | Re-run the full test matrix (Phase 8's 13 scenarios + Phase 10H's expanded checklist) against the live domain | N/A (verification) |
| 8 | Register the Razorpay production webhook against the production API URL | Yes — remove/repoint the webhook in Razorpay Dashboard |
| 9 | Production smoke test on the live domain, including one real small Razorpay payment **under the client's own control** | N/A — a real transaction, not reversible in the payment-ledger sense, but standard practice |
| 10 | Rollback window — Render kept fully running, pre-cutover DNS state documented, for an agreed stabilization period | N/A (observation period) |
| 11 | Client handover (Phase 10J documentation, credential transfer, admin training) | N/A |
| 12 | Only after stabilization: decommission Render and any now-unused resources | **Not reversible** — the actual point of no return for this whole migration |

**Step 5 (DNS/nameserver change) is the true go/no-go point** — everything before it is fully reversible with zero customer-facing impact (nothing customer-facing is attached to `rajadhaniyam.in` yet, so steps 1-4 can be built and tested without any risk to a live audience). Steps 6-9 remain easily reversible (point the Cloudflare route/Worker var back, or revert nameservers). Step 12 is the only genuinely irreversible action, and it's intentionally last, after a full stabilization period.

### I. Rollback plan

Same as Phase 10G, reconfirmed: Worker-level rollback (repoint `VITE_API_BASE_URL` back to Render, redeploy same Worker) is the fast path for any application-level issue once Cloudflare is already the front door; DNS/nameserver rollback (point back at GoDaddy or repoint the Cloudflare route at Render's origin) is the slower path, needed only if Cloudflare itself is the problem. Render stays untouched and running throughout.

### J. Remaining blockers

1. **DNS not yet propagated/configured for `rajadhaniyam.in`** — expected for a 2-day-old domain; needs to be actively configured (nameservers → Cloudflare) as part of Phase 11E/F's plan before any of it can execute — not something to wait out passively.
2. **Staging vs. production Supabase relationship unconfirmed** — client needs to compare project ref `okoalheebdrszwkiombn` (staging) against their Render production `DATABASE_URL` to know whether staging tests have been touching production data.
3. **Razorpay staging credentials still LIVE, not TEST** (Phase 9B) — unresolved, deferred to final QA per this phase's explicit instruction, not a blocker for the rest of Phase 11's planning.
4. `SUPABASE_URL` is unset on Cloud Run staging entirely — worth deciding whether production needs it before finalizing C's env var list.
5. No production secrets, Cloud Run service, or Cloudflare Worker exist yet — Phase 11 is planning only, per instructions.

### K. Documentation

This section committed and pushed to `migration/cloudflare-storefront` only — not merged to `master`.

## Phase 12: Supabase/Razorpay verification, production secrets plan, pre-cutover checklist (2026-09-17)

Read-only verification and planning only. `rajadhaniyam.com` was not touched, inspected, or referenced in any check this phase. No DNS, Cloudflare, Cloud Run, Render, Supabase, or Razorpay changes were made.

### A. Supabase staging vs. production — **RESOLVED: 1. SAME PROJECT**

The client provided Render production's `DATABASE_URL` directly in chat. Only the non-secret project reference was extracted for comparison — the password portion is never repeated below or anywhere else in this document.

- Render production project ref: `okoalheebdrszwkiombn`
- Staging project ref (Phase 11B): `okoalheebdrszwkiombn`
- **Identical.** Region also matches (`aws-0-ap-northeast-2.pooler.supabase.com`, Seoul).

**Classification: 1. SAME PROJECT.**

**Staging and Render production share the same Supabase project/database.** There are not two separate databases today — Cloud Run staging has been reading from and writing to the actual production database this entire time.

**Operational consequence**: every write made while testing staging (product/order reads are harmless, but any register/login/cart/checkout/order-creation test) creates or modifies real rows in the same database the live Render production site uses. Stock decrements, customer accounts, and orders created during staging tests are indistinguishable from real production activity at the database level.

**Did staging's existing test activity touch production data?** Yes, confirmed: the COD test order placed during Phase 8 verification (order `#RJD32963552`, ₹264) was written directly to this shared production database — it was manually cleaned up immediately after (stock restored, order and test customer deleted, as reported in Phase 8), but it confirms the risk described above was real, not hypothetical, for that one test. No further cleanup or data changes were made in this phase — this section is a finding only, per instructions.

**A note on the credential itself**: the message containing this `DATABASE_URL` included the plaintext database password. It hasn't been repeated anywhere in this session's outputs or in this document, but since it's now present in this conversation's history, rotating that Supabase database password at some point (Supabase dashboard → Database → Reset password) would be reasonable hygiene — not urgent, and not something changed here.

### B. `SUPABASE_URL` gap — **SUPABASE_URL REQUIRED**

Traced every reference in the codebase:
- `apps/api/src/config/env.ts:13-14` — both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are declared `z.string().optional()` (app boots fine without either).
- `apps/api/src/modules/uploads/storage.ts` — the **only** place either is used. `requireSupabaseConfig()` (lines 9-17) throws `HttpError(503, "Image upload isn't configured — SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing")` unless **both** are set — the service-role key alone is not sufficient, since every Storage REST call (`ensureBucketExists`, `uploadFile`) builds its request URL as `` `${url}/storage/v1/...` `` directly from `SUPABASE_URL`. Talks to Supabase Storage's raw REST API, not the `@supabase/supabase-js` SDK (deliberate, per the file's own comment).
- No other file in `apps/api` references `SUPABASE_URL`.
- **Frontend**: no match for `supabase`/`SUPABASE_URL` anywhere in `apps/storefront` — the client never talks to Supabase directly, confirming the architecture is strictly storefront → API → Supabase.
- **Database connection**: `packages/database/prisma/schema.prisma:19-20` — `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`. `DATABASE_URL` (pooled) is the sole runtime DB connection; `DATABASE_URL` is the only one of the two Cloud Run actually needs at runtime (`DIRECT_URL` is for migrations, not used by the running app).

**Conclusion**: `SUPABASE_URL` is not needed for the database or for core storefront/checkout/order functionality (all of that goes through `DATABASE_URL`/Prisma), but it **is required for admin product-image uploads to work at all** — without it, that one feature fails with a 503, everything else keeps working. Since staging currently has it unset (confirmed via `gcloud run services describe` in Phase 11), **image upload is presumably broken on staging right now** — not tested directly in this phase (would require an admin-panel write action, out of scope for read-only verification) but a direct consequence of the missing config. **Production should include `SUPABASE_URL`** if admin image uploads are expected to work.

### C. Staging Razorpay safety — **LIVE**

Re-checked via the same prefix-only method as Phase 9B (no value printed): `PAYMENT_PROVIDER_KEY` on staging is still **LIVE**, unchanged since Phase 9B/10/11.

**Staging Razorpay payment testing must NOT be performed until this is changed to a TEST-mode key.** Not changed by the assistant — this remains the client's action to take (Razorpay Dashboard → Test Mode → API Keys → new secret version in Secret Manager, per the Phase 9 report).

### D. Production secrets plan

| Secret name | Required by production? | Source | Notes |
|---|---|---|---|
| `DATABASE_URL_PRODUCTION` | Yes | Client — production Supabase pooled connection string | Must include `?pgbouncer=true` (see "Known issues" above — a real bug hit earlier in this project) |
| `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION` | Yes, if image upload is needed | Client — production Supabase project's service role key | Paired with the URL below; both required together per B |
| `JWT_SECRET_PRODUCTION` | Yes | Generated fresh (do not reuse staging's) | Auth token signing |
| `SESSION_SECRET_PRODUCTION` | Yes | Generated fresh (do not reuse staging's) | Session signing |
| `PAYMENT_PROVIDER_KEY_PRODUCTION` | Yes | Client — Razorpay **LIVE** Key ID | Only entered once production cutover is actually imminent, never before |
| `PAYMENT_PROVIDER_SECRET_PRODUCTION` | Yes | Client — Razorpay **LIVE** Key Secret | Same timing caution as above |
| `PAYMENT_WEBHOOK_SECRET_PRODUCTION` | Yes, once the production webhook is registered | Razorpay Dashboard, generated when the webhook is created | Not needed until Phase 11H/cutover step 8 |
| `SUPABASE_URL_PRODUCTION` (non-secret today, but listed for completeness) | Yes, per B | Client — production Supabase project URL | Currently missing from staging entirely; should not be skipped for production |

**None of these have been created.** Explicitly confirmed: **staging's existing secrets (`DATABASE_URL`, `PAYMENT_PROVIDER_KEY`, etc.) will not be reused as production secret objects** — production gets entirely separate Secret Manager entries under the `_PRODUCTION` names above, with no shared IAM bindings or version history, even though A/E confirmed Supabase is a genuinely shared project: `DATABASE_URL_PRODUCTION` would be its own secret *object*, populated with the same underlying connection string if sharing continues, not a literal reuse of the staging secret resource. This keeps IAM/access and version history independent even where the underlying data isn't.

### E. Production database safety — SAME PROJECT (confirmed in A)

Production and staging must be treated as **environments sharing one database**, not as isolated environments.

**Application-level risks**:
- Any future staging test (including the still-deferred Razorpay TEST-mode payment testing) writes directly into production's `Order`, `Payment`, `OrderItem`, `User`, and `ProductVariant`(stock) rows — same as the Phase 8 COD test order.
- There is no technical safeguard preventing this — the app has no environment-tagging on data, so a staging-created order is indistinguishable from a real customer order in the database itself, discoverable only by manual review (order number, customer email, timing).
- `DATABASE_URL_PRODUCTION` (per the secrets plan in D) would, if populated with this same connection string, point the eventual production Cloud Run service at the identical database staging already uses — meaning "staging" and "production" become two deployments of the same data, not two environments.

**What must be verified/decided before cutover**:
1. **Explicit decision**: continue deliberately sharing one Supabase project between staging and production (accepting the cleanup discipline already demonstrated in Phase 8, and applying the same discipline to any remaining staging testing, including final-QA Razorpay TEST payments), **or** provision a separate Supabase project for staging before further testing.
2. If sharing continues: every future staging test (especially the deferred Razorpay TEST payment/failure/cancel tests in Phase 9D/E) must be followed by the same manual cleanup pattern already proven — restore stock, delete test order/customer — since there is no automatic separation.
3. No database was created, no schema changed, no migration run, no data modified in this phase — this is a finding and a decision point, not an action taken.

### F. Final pre-cutover checklist

| # | Category | Status | Notes |
|---|---|---|---|
| 1 | Supabase | REQUIRES USER ACTION | Confirmed SAME PROJECT as production (A/E) — decide whether to keep sharing or provision a separate staging project before further testing |
| 2 | Cloud Run production | REQUIRES USER ACTION | Design finalized (Phase 11C), not deployed — awaiting go-ahead |
| 3 | Production secrets | REQUIRES USER ACTION | Plan finalized (D above), none created — values must come from the client |
| 4 | Cloudflare production Worker | REQUIRES USER ACTION | Design finalized (Phase 11E), not deployed |
| 5 | `rajadhaniyam.in` DNS | REQUIRES USER ACTION | Domain registered, no records yet — needs active GoDaddy→Cloudflare nameserver change when ready (Phase 11A/F) |
| 6 | Razorpay | **BLOCKED** | Staging still on LIVE credentials (C above) — must move to TEST before any payment testing; production LIVE keys not needed until actual cutover |
| 7 | Final application QA | REQUIRES USER ACTION | Checklist exists (Phase 10I), not yet executed against production (production doesn't exist yet) |
| 8 | Rollback | READY | Plan documented and proven in pattern (Phase 8's Worker-var rollback), Render untouched and running |
| 9 | Client handover | REQUIRES USER ACTION | Documentation checklist exists (Phase 10J), materials not yet assembled |

### G. Documentation

This section committed and pushed to `migration/cloudflare-storefront` only — not merged to `master`. No application code modified this phase (docs-only change, as instructed).

## Phase 13: Exact production deployment configuration (2026-09-17)

Configuration prepared and documented only — nothing deployed, no DNS/Supabase/Render/Razorpay changes. `rajadhaniyam.com` not touched.

**Standing warning, restated**: staging (`rajadhaniyam-api-staging`) and Render production share one Supabase database (`okoalheebdrszwkiombn`, confirmed Phase 12A). Any staging write test still requires explicit approval and a cleanup plan — nothing about this phase's planning changes that.

### A. Production Cloud Run — exact configuration

Mirrored directly from staging's live `gcloud run services describe` output (same proven values, not re-derived):

| Setting | Value |
|---|---|
| Service | `rajadhaniyam-api-production` |
| Region / Project | `asia-south1` / `xyratek-websites` |
| Image | `asia-south1-docker.pkg.dev/xyratek-websites/rajadhaniyam-api/rajadhaniyam-api@sha256:2d2861c7f81b52cdbfa306004bfd286404f2e69f0726d5d550793905647c2568` (existing verified digest, no rebuild) |
| CPU / Memory | 1 vCPU / 512Mi |
| Min / Max instances | 1 / 3 |
| Concurrency | 80 |
| CPU allocation | request-based (no always-allocated-CPU flag) |
| Public access | `run.googleapis.com/invoker-iam-disabled: true` — the same `--no-invoker-iam-check` mechanism proven in Phase 7, no `allUsers` IAM binding, no org-policy interaction |

**Exact commands (not yet executed)** — two-step, mirroring exactly what was actually run for staging:
```
gcloud run deploy rajadhaniyam-api-production \
  --image=asia-south1-docker.pkg.dev/xyratek-websites/rajadhaniyam-api/rajadhaniyam-api@sha256:2d2861c7f81b52cdbfa306004bfd286404f2e69f0726d5d550793905647c2568 \
  --region=asia-south1 --project=xyratek-websites \
  --cpu=1 --memory=512Mi \
  --min-instances=1 --max-instances=3 --concurrency=80 \
  --set-env-vars=NODE_ENV=production,STOREFRONT_URL=https://rajadhaniyam.in,ADMIN_URL=https://rajadhaniyam-admin.onrender.com \
  --set-secrets=DATABASE_URL=DATABASE_URL_PRODUCTION:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY_PRODUCTION:latest,JWT_SECRET=JWT_SECRET_PRODUCTION:latest,SESSION_SECRET=SESSION_SECRET_PRODUCTION:latest,PAYMENT_PROVIDER_KEY=PAYMENT_PROVIDER_KEY_PRODUCTION:latest,PAYMENT_PROVIDER_SECRET=PAYMENT_PROVIDER_SECRET_PRODUCTION:latest

gcloud run services update rajadhaniyam-api-production \
  --region=asia-south1 --project=xyratek-websites \
  --no-invoker-iam-check
```
(Public access is applied as a second step because that's the exact sequence that worked for staging — `--no-invoker-iam-check` at initial `deploy` time was not what was actually exercised in Phase 7.) **Not run.**

### B. Production environment variables

- `NODE_ENV=production` — fixed.
- `STOREFRONT_URL=https://rajadhaniyam.in` — as specified.
- `ADMIN_URL`: **`https://rajadhaniyam-admin.onrender.com`** — the admin panel is explicitly out of scope for this migration (same note as staging's config, and confirmed again here: neither this phase's target architecture diagram nor any prior phase proposes moving admin off Render). Production API should point at the real, existing Render admin URL, not a placeholder.
- `EXTRA_CORS_ORIGINS`: **not required for the final steady state** — once DNS is cut over, `STOREFRONT_URL` (`https://rajadhaniyam.in`) and `ADMIN_URL` already cover the two real production origins. It **will be temporarily useful during pre-cutover verification** (Phase 13I step 4 below), the same way staging's `EXTRA_CORS_ORIGINS` currently holds the Cloudflare preview's `*.workers.dev` origin — production will need its own Worker's `*.workers.dev` URL added temporarily while testing before `rajadhaniyam.in` is attached, then it can be removed once DNS is live and `STOREFRONT_URL` alone is authoritative.

Not applied.

### C. Production secrets — requirement/source/independence

| Secret | Why required | Source | Differs from staging? | Shareable? |
|---|---|---|---|---|
| `DATABASE_URL_PRODUCTION` | Prisma's runtime DB connection (`packages/database/prisma/schema.prisma:19`) | Same underlying Supabase project (`okoalheebdrszwkiombn`, per A/E in Phase 12) — value is the same connection string staging uses today | No — same database, confirmed shared | Must remain an independent **secret object** even though the underlying value is currently identical, so IAM/version history don't cross environments |
| `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION` | Admin image upload via Supabase Storage REST API (`apps/api/src/modules/uploads/storage.ts`) | Same Supabase project as above | No, same project → same key | Independent secret object, same reasoning |
| `JWT_SECRET_PRODUCTION` | Signs auth tokens | Freshly generated | **Yes — must differ from staging.** Sharing a signing secret across environments would let a staging-issued token authenticate against production | Never shared |
| `SESSION_SECRET_PRODUCTION` | Signs session cookies | Freshly generated | **Yes — must differ.** Same reasoning as JWT | Never shared |
| `PAYMENT_PROVIDER_KEY_PRODUCTION` | Razorpay Key ID for order creation/checkout | Client's Razorpay Dashboard, **LIVE** mode | **Yes — must differ.** Staging is TEST-mode (once corrected) or currently LIVE-but-unused; production is the only place real LIVE keys belong | Never shared |
| `PAYMENT_PROVIDER_SECRET_PRODUCTION` | Razorpay Key Secret, HMAC signature verification | Client's Razorpay Dashboard, **LIVE** mode | Yes — must differ | Never shared |
| `PAYMENT_WEBHOOK_SECRET_PRODUCTION` | Verifies `x-razorpay-signature` on `/payments/webhook` | Generated by Razorpay when the production webhook is registered (not yet — see H) | Yes — staging doesn't have this secret at all today | Never shared |

None created or populated. No values printed.

### D. Database configuration

- **Production `DATABASE_URL_PRODUCTION`**: confirmed to be the same underlying Supabase connection (project `okoalheebdrszwkiombn`) staging already uses — per the SAME PROJECT finding in Phase 12A, there is no separate production database to point at.
- **PgBouncer**: `?pgbouncer=true` must be preserved on the production secret's value, exactly as staging's `DATABASE_URL` already has it — this was a real bug hit earlier in this project (see "Known issues" above) and applies identically here.
- **`DIRECT_URL`**: confirmed **not required at Cloud Run runtime** — `packages/database/prisma/schema.prisma:20` only references it as `directUrl`, used exclusively by Prisma's migration tooling (`prisma migrate`), never by the running application. Not needed as a Cloud Run env var/secret for either staging or production.
- **Does Prisma require a migration during this deployment?** No — production would connect to the identical, already-migrated schema staging already uses (same database). No new migration is needed or was run.

### E. `SUPABASE_URL` — **REQUIRED** (re-confirmed)

Same conclusion as Phase 12B, re-verified against the current code:
- `apps/api/src/config/env.ts:13` — `SUPABASE_URL: z.string().optional()` (app boots without it).
- `apps/api/src/modules/uploads/storage.ts:9-17` — `requireSupabaseConfig()` throws a 503 unless **both** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set; every Storage REST call builds its URL directly from `SUPABASE_URL` (lines 23, 28, 50).
- No other backend reference; no frontend reference at all.

**Required** for admin product-image uploads to function; not required for auth/cart/checkout/orders (all via `DATABASE_URL`/Prisma). Currently absent from staging's Cloud Run config entirely (confirmed again via `gcloud run services describe` in this phase) — the production env var list in B should include it if image uploads are expected to work in production; **not added anywhere in this phase**.

### F. Production Cloudflare Worker — exact configuration

1. **Config file**: a new file, e.g. `apps/storefront/wrangler.production.json` — the existing `apps/storefront/wrangler.json` has `"name": "rajadhaniyam-storefront-preview"` hardcoded and must not be repurposed; production needs its own file (or a `--name` override at deploy time) so the preview is never at risk of being overwritten.
2. **Build command**: identical to preview — `bun run --cwd=apps/storefront build:cf` (plain `vite build`, `cloudflare-module` preset, no code changes).
3. **Required `VITE_*` build-time variables**: `VITE_API_BASE_URL=<production Cloud Run URL>`, `VITE_ADMIN_URL=https://rajadhaniyam-admin.onrender.com`.
4. **Production API URL placeholder**: exact hostname only known after step A's deploy actually runs (Cloud Run assigns it, e.g. `https://rajadhaniyam-api-production-<hash>-el.a.run.app`) — use as a placeholder until then.
5. **Compatibility with the preview Worker**: fully compatible — same `compatibility_date`/`compatibility_flags`/build output; only `name`, config file, and the `VITE_*` values differ.
6. **Production-specific changes needed**: distinct Worker name (`rajadhaniyam-storefront-production`), distinct config file, production env var values, and (once DNS is ready) a Cloudflare Custom Domain attachment — nothing else.

Not deployed. Preview Worker (`rajadhaniyam-storefront-preview`) not touched.

### G. DNS plan (prepared, not executed)

Target: `rajadhaniyam.in` → Cloudflare → production Worker; `www.rajadhaniyam.in` → redirect to `https://rajadhaniyam.in`.

Steps that will eventually be executed (documented only):
1. **Cloudflare side**: add `rajadhaniyam.in` as a new zone in the Cloudflare account already used for the preview Worker (Add a Site → enter `rajadhaniyam.in` → Cloudflare scans/proposes DNS records, which will be empty/minimal per Phase 11A's finding of no existing records).
2. **GoDaddy side**: update `rajadhaniyam.in`'s nameservers (currently `ns41`/`ns42.domaincontrol.com`, per Phase 11A) to the two nameservers Cloudflare assigns during step 1 — done in the GoDaddy DNS/domain management panel for **`rajadhaniyam.in` only**, never touching the `.com` domain's own GoDaddy configuration.
3. Wait for Cloudflare to detect the nameserver change (active-zone status).
4. In Cloudflare, attach `rajadhaniyam.in` to the production Worker via **Workers Routes** or **Custom Domains** (Custom Domains is simpler — Cloudflare manages the proxied record automatically).
5. Add a redirect rule (Cloudflare Bulk Redirects or a Page Rule) for `www.rajadhaniyam.in` → `https://rajadhaniyam.in` (301, preserving path).
6. SSL/TLS: automatic once the zone is active and proxied — no manual certificate work.

**Not executed.** No nameserver change, no Cloudflare zone created, nothing added to GoDaddy.

### H. Razorpay

- **Production webhook URL format**: `https://<production-cloud-run-url>/payments/webhook` (exact hostname known only once A's deploy runs), or `https://rajadhaniyam.in/api/...`-style if a custom API hostname is ever added — not planned currently, direct Cloud Run URL is sufficient (same pattern as staging).
- **Credentials required**: `PAYMENT_PROVIDER_KEY_PRODUCTION`, `PAYMENT_PROVIDER_SECRET_PRODUCTION` (LIVE mode), `PAYMENT_WEBHOOK_SECRET_PRODUCTION` (generated at webhook creation time).
- **When TEST credentials should be used**: staging only, for the deferred Phase 9D/E verification during final QA — never in production.
- **When LIVE credentials should be used**: production only, entered directly by the client, only once production cutover is imminent (not during general prep).
- **Final payment test sequence** (for final QA, not now): (1) confirm staging holds TEST credentials, (2) run Phase 9D (successful TEST payment) and 9E (failure/cancellation TEST payment) against staging, (3) confirm signature verification and order/payment status consistency, (4) only after production is otherwise fully cut over and stable, register the production webhook and do one small real LIVE payment under the client's own control as a final smoke test.
- **Explicitly deferred**: no Razorpay testing, webhook creation, or credential change happens in this phase.

### I. Cutover sequence — reversibility and impact

| # | Step | Reversible? | Customer impact | Validation required |
|---|---|---|---|---|
| 1 | Deploy `rajadhaniyam-api-production` Cloud Run (per A) | Reversible (delete service) | None — no traffic routed yet | `/health` responds 200 |
| 2 | Create `_PRODUCTION` secrets, client populates values (per C) | Reversible (delete/replace secrets) | None | Secrets exist, correct count, no values logged |
| 3 | Verify production Cloud Run via its own `*.run.app` URL | N/A (read-only) | None | `/health`, `/products` (DB read), logs clean |
| 4 | Build & deploy production Worker (per F), reachable only via its own `*.workers.dev` URL first, `EXTRA_CORS_ORIGINS` on production Cloud Run temporarily includes this Worker's `*.workers.dev` origin (per B) | Reversible (redeploy/delete Worker) | None — not the live domain yet | Full manual test matrix (Phase 8 + 10H) against `*.workers.dev` → production Cloud Run |
| 5 | Add `rajadhaniyam.in` as a Cloudflare zone (per G step 1) | Reversible (remove zone) | None | Zone created, DNS records reviewed |
| 6 | Change `rajadhaniyam.in` nameservers at GoDaddy to Cloudflare's (per G step 2) | **Slow to reverse** — propagation delay in both directions; **the real go/no-go point** | None until Cloudflare zone is also serving content — domain currently has no live records | Cloudflare shows zone "active" |
| 7 | Attach `rajadhaniyam.in` to the production Worker (Custom Domain), set up `www` redirect | Reversible while nameservers already point at Cloudflare | **Domain goes live** — this is the step that makes `rajadhaniyam.in` serve real traffic for the first time | Load `https://rajadhaniyam.in` externally, confirm correct app + SSL |
| 8 | Remove the temporary `EXTRA_CORS_ORIGINS` entry from production Cloud Run now that `STOREFRONT_URL` alone is correct | Reversible | None | CORS preflight still succeeds from `rajadhaniyam.in` |
| 9 | Re-run full test matrix against the live domain | N/A (verification) | None (read + controlled test writes against the shared production DB — same caution as any staging test) | All scenarios pass |
| 10 | Register Razorpay production webhook (per H) | Reversible (remove/repoint webhook) | None | Test event or dashboard confirmation |
| 11 | Production smoke test incl. one real LIVE payment under client control | Payment itself **not reversible** in the ledger sense (standard for any real transaction) | Real money movement, client-initiated and controlled | Order/payment status consistent, webhook (if used) fires correctly |
| 12 | Rollback window — Render stays running, pre-cutover DNS state documented, stabilization period | N/A (observation) | None | Monitor logs/error rates |
| 13 | Decommission Render + unused resources | **Irreversible** — the true point of no return | None if steps 1-12 were clean | Final confirmation from client before executing |

**Rollback mechanism, every step through 12**: revert the Worker's `VITE_API_BASE_URL` to `https://rajadhaniyam-api.onrender.com` and redeploy the same Worker name (Cloudflare stays the front door if nameservers already moved; otherwise nothing customer-facing has changed at all). Render remains untouched and running throughout, exactly as required.

### J. Documentation

This section committed and pushed to `migration/cloudflare-storefront` only — not merged to `master`. No production deployment, DNS, Supabase, Render, or Razorpay change made in this phase.

## Phase 14: Production Cloud Run deployment — STOPPED, missing secrets (2026-09-17)

**Deployment did not proceed.** Per this phase's own instruction ("If the production secret objects do not yet exist, STOP before deployment and report exactly which secret objects are missing"), `gcloud secrets list --project=xyratek-websites` was checked before any deploy attempt:

```
Existing secrets: DATABASE_URL, JWT_SECRET, PAYMENT_PROVIDER_KEY, PAYMENT_PROVIDER_SECRET, SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY
```

All 6 are staging's existing secrets (unchanged, per Phase 7). **None of the 7 expected `_PRODUCTION` secret objects exist**:

| Missing secret | Status |
|---|---|
| `DATABASE_URL_PRODUCTION` | Does not exist |
| `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION` | Does not exist |
| `JWT_SECRET_PRODUCTION` | Does not exist |
| `SESSION_SECRET_PRODUCTION` | Does not exist |
| `PAYMENT_PROVIDER_KEY_PRODUCTION` | Does not exist |
| `PAYMENT_PROVIDER_SECRET_PRODUCTION` | Does not exist |
| `PAYMENT_WEBHOOK_SECRET_PRODUCTION` | Does not exist |

Per instructions, **secrets were not created or populated without explicit approval** — not even as empty containers, since this phase's instructions were to stop and report, not to create.

**Nothing else in Phase 14 was executed as a result**: no Cloud Run service was deployed, so 14A (deployment verification), 14B (smoke tests), 14C (log verification), and 14D (storage check) are all **N/A — no production service exists to test.** 14E (rollback) is N/A — there is nothing to roll back; Render and staging remain completely untouched, exactly as before this phase started.

**To unblock**: the 7 production secrets need to be created (empty containers) and populated with production values before deployment can proceed:
- `DATABASE_URL_PRODUCTION` / `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION` — per Phase 13C, may intentionally hold the same underlying values as staging's `DATABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (confirmed shared Supabase project), just as separate secret objects.
- `JWT_SECRET_PRODUCTION` / `SESSION_SECRET_PRODUCTION` — must be freshly generated, never copied from staging.
- `PAYMENT_PROVIDER_KEY_PRODUCTION` / `PAYMENT_PROVIDER_SECRET_PRODUCTION` — Razorpay LIVE credentials, entered directly by the client only when cutover is actually imminent.
- `PAYMENT_WEBHOOK_SECRET_PRODUCTION` — not needed until the production webhook is registered (later in the cutover sequence), but the secret object itself can be created empty now if desired.
- `SUPABASE_URL` (non-secret, per Phase 13E — required for admin image uploads): the correct value is the project URL for `okoalheebdrszwkiombn` (`https://okoalheebdrszwkiombn.supabase.co`, Supabase's standard URL pattern for a project ref) — **not independently confirmed against a live value in this phase** (no reachability test performed, to avoid any unnecessary network call against production Supabase infrastructure outside the scope of this stop-and-report phase); worth a quick visual confirmation in the Supabase dashboard before use.

Waiting for explicit approval before creating any of these secret objects.

## Phase 14 (continued): Production secrets created (2026-09-17)

With explicit approval, 5 of the 7 planned production secret objects were created in Secret Manager. No values printed at any point — DB/Supabase values were piped directly from the staging secret into the new one via `gcloud secrets versions access | gcloud secrets versions add`; JWT/session values were freshly generated with `openssl rand -hex 32` and piped in the same way.

| Secret | Created? | Version | Value source |
|---|---|---|---|
| `DATABASE_URL_PRODUCTION` | Yes | 1 | Copied from staging's `DATABASE_URL` (same underlying Supabase project, confirmed Phase 12A) |
| `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION` | Yes | 1 | Copied from staging's `SUPABASE_SERVICE_ROLE_KEY` (same project) |
| `JWT_SECRET_PRODUCTION` | Yes | 1 | Freshly generated (`openssl rand -hex 32`) — independent from staging's |
| `SESSION_SECRET_PRODUCTION` | Yes | 1 | Freshly generated (`openssl rand -hex 32`) — independent from staging's |
| `PAYMENT_WEBHOOK_SECRET_PRODUCTION` | Yes (container only) | 0 | Empty — no value until the production Razorpay webhook is actually registered later in the cutover |
| `PAYMENT_PROVIDER_KEY_PRODUCTION` | **Not created** | — | Left entirely for the client — requires their Razorpay **LIVE** Key ID, entered directly in the GCP Console |
| `PAYMENT_PROVIDER_SECRET_PRODUCTION` | **Not created** | — | Same — client's Razorpay LIVE Key Secret, entered directly |

Full current secret list (names only): `DATABASE_URL`, `DATABASE_URL_PRODUCTION`, `JWT_SECRET`, `JWT_SECRET_PRODUCTION`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET`, `PAYMENT_WEBHOOK_SECRET_PRODUCTION`, `SESSION_SECRET`, `SESSION_SECRET_PRODUCTION`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`.

**Remaining blocker before Phase 13A's deploy command can run**: `PAYMENT_PROVIDER_KEY_PRODUCTION` and `PAYMENT_PROVIDER_SECRET_PRODUCTION` still need to be created by the client (Secret Manager → Create secret → paste the Razorpay LIVE Key ID/Secret) before the production Cloud Run deploy can include them. Staging, Render, Supabase, DNS, and Cloudflare remain untouched.

## Phase 14 (continued): Remaining 2 production secrets populated by client (2026-09-17)

Client created and populated `PAYMENT_PROVIDER_KEY_PRODUCTION` and `PAYMENT_PROVIDER_SECRET_PRODUCTION` directly in the GCP Console with real Razorpay production credentials — the assistant did not see, request, or handle these values. Client also populated `PAYMENT_WEBHOOK_SECRET_PRODUCTION` (previously created as an empty container) with a real value from the Razorpay Dashboard.

Verified via `gcloud secrets versions list` (names/counts only) — **all 7 production secrets now exist with exactly 1 version each**:

| Secret | Version | Notes |
|---|---|---|
| `DATABASE_URL_PRODUCTION` | 1 | Unchanged from earlier this phase |
| `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION` | 1 | Unchanged |
| `JWT_SECRET_PRODUCTION` | 1 | Unchanged |
| `SESSION_SECRET_PRODUCTION` | 1 | Unchanged |
| `PAYMENT_PROVIDER_KEY_PRODUCTION` | 1 | **New** — client-populated, re-checked by prefix only (`rzp_live_...`): **MODE=LIVE**, correct for production |
| `PAYMENT_PROVIDER_SECRET_PRODUCTION` | 1 | **New** — client-populated, not independently re-checked (paired with the Key ID above by Razorpay's own design) |
| `PAYMENT_WEBHOOK_SECRET_PRODUCTION` | 1 | **New** — client-populated from an already-registered Razorpay webhook |

**Open question raised back to the client**: a populated `PAYMENT_WEBHOOK_SECRET_PRODUCTION` implies a webhook has already been registered on Razorpay's side, but production Cloud Run doesn't exist yet — there is no production URL for a webhook to call. Asked the client which URL that webhook currently points at.

**Answer: `https://rajadhaniyam-storefront.onrender.com`** — ⚠️ **this is misconfigured.**

That's the **storefront** service (the SSR frontend, `rajadhaniyam-storefront` on Render), not the **API** service. The `/payments/webhook` route only exists on the API (`apps/api/src/modules/payments/payments.routes.ts`) — the storefront has no such route. As currently registered, every webhook delivery attempt from Razorpay hits the storefront and gets a 404; nothing is being processed.

**Impact assessment**: not a checkout-breaking issue today — Phase 9A confirmed the primary payment-completion path (`POST /payments/verify`, client-side signature verification) does not depend on the webhook succeeding or even existing. The webhook exists only as a backup for the case where a successful payment's verify call never reaches the server (e.g. the browser drops connection right after Razorpay's checkout succeeds) — with it misdirected, that backup silently does nothing, which is a real but narrow gap, not an active outage.

**Correct value**: `https://rajadhaniyam-api.onrender.com/payments/webhook` — the existing, already-documented Render production API webhook URL (per `docs/DEPLOYMENT.md`). **Not changed by the assistant** — per this migration's standing restriction on ever creating/modifying Razorpay webhooks, this is the client's own action to take (Razorpay Dashboard → Settings → Webhooks → edit URL; the existing secret can stay, no need to regenerate). This will need to be updated a second time once production actually cuts over to the Cloud Run URL (or a future `rajadhaniyam.in` API subdomain) — flagging now so it isn't missed at that point either.

**All 7 production secrets are now populated.** The Phase 13A production Cloud Run deploy command is technically unblocked on the secrets front — deployment itself still requires explicit client approval before executing, per standing process. The webhook misconfiguration above is independent of the Cloud Run deployment and does not block it.

## Phase 14A/B/C: Production Cloud Run DEPLOYED (2026-09-17)

**Client explicitly asked the assistant to fix the webhook URL and deploy.** The webhook fix was declined by the assistant — this session has no Razorpay dashboard/API access at all (no credentials, no session, nothing configured in this environment), so it technically cannot make that change, independent of the standing restriction. That remains the client's own action (see above). The Cloud Run deployment proceeded, since it was both previously fully specified/reviewed (Phase 13A) and explicitly approved in this message.

### Deployment

Executed the exact two-step command documented in Phase 13A, unmodified:
```
gcloud run deploy rajadhaniyam-api-production --image=...@sha256:2d2861c7f81b52cdbfa306004bfd286404f2e69f0726d5d550793905647c2568 \
  --region=asia-south1 --project=xyratek-websites --cpu=1 --memory=512Mi \
  --min-instances=1 --max-instances=3 --concurrency=80 \
  --set-env-vars=NODE_ENV=production,STOREFRONT_URL=https://rajadhaniyam.in,ADMIN_URL=https://rajadhaniyam-admin.onrender.com \
  --set-secrets=DATABASE_URL=DATABASE_URL_PRODUCTION:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY_PRODUCTION:latest,JWT_SECRET=JWT_SECRET_PRODUCTION:latest,SESSION_SECRET=SESSION_SECRET_PRODUCTION:latest,PAYMENT_PROVIDER_KEY=PAYMENT_PROVIDER_KEY_PRODUCTION:latest,PAYMENT_PROVIDER_SECRET=PAYMENT_PROVIDER_SECRET_PRODUCTION:latest

gcloud run services update rajadhaniyam-api-production --region=asia-south1 --project=xyratek-websites --no-invoker-iam-check
```
Succeeded on first attempt (100% traffic routed immediately, no rollout issues).

### A. Deployment verification

| Field | Value |
|---|---|
| Service | `rajadhaniyam-api-production` |
| Region | `asia-south1` |
| Revision | `rajadhaniyam-api-production-00001-wkk` |
| Image tag | `rajadhaniyam-api:f2196591fa87` |
| Actual digest | `sha256:2d2861c7f81b52cdbfa306004bfd286404f2e69f0726d5d550793905647c2568` — matches the pre-verified image exactly, no rebuild |
| CPU | 1 vCPU |
| Memory | 512Mi |
| Min instances | 1 (`autoscaling.knative.dev/minScale: '1'`) |
| Max instances | 3 (`autoscaling.knative.dev/maxScale: '3'`) |
| Concurrency | 80 |
| CPU allocation | request-based (no always-allocated annotation) |
| Public access | `run.googleapis.com/invoker-iam-disabled: 'true'` — same mechanism as staging, **no `allUsers` IAM binding**, no org policy touched |
| Env var names | `NODE_ENV`, `STOREFRONT_URL`, `ADMIN_URL`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET` |
| Secret refs | `DATABASE_URL_PRODUCTION:latest`, `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION:latest`, `JWT_SECRET_PRODUCTION:latest`, `SESSION_SECRET_PRODUCTION:latest`, `PAYMENT_PROVIDER_KEY_PRODUCTION:latest`, `PAYMENT_PROVIDER_SECRET_PRODUCTION:latest` |
| Service URLs | `https://rajadhaniyam-api-production-855749773400.asia-south1.run.app`, `https://rajadhaniyam-api-production-656vlc3k6a-el.a.run.app` |

No values printed at any point.

### B. Read-only smoke tests

| Endpoint | HTTP status | Result | DB access |
|---|---|---|---|
| `GET /health` | 200 | `{"success":true,"data":{"status":"ok"}}` | N/A |
| `GET /products` | 200 | Real product data returned (e.g. "Kambu Broken", ₹95) | Yes — confirms `DATABASE_URL_PRODUCTION` connects correctly |
| `GET /categories` | 200 | Real category data returned | Yes |

Zero errors across all three. Notably, product/category image URLs already resolve to `https://rajadhaniyam.in/assets/...` — direct confirmation that `STOREFRONT_URL=https://rajadhaniyam.in` is wired correctly into image URL generation, even though the domain isn't live yet. No write endpoints were touched, per instructions.

### C. Log verification

`gcloud logging read` failed in this environment with a Windows path-quoting error unrelated to the deployment itself (a local CLI/shell issue, not a Cloud Run problem) — worked around by querying the Cloud Logging REST API directly with an access token. 12 log entries in the verification window: 8 `INFO` (the 3 smoke-test HTTP requests, all status 200, plus routine request logging), 2 `NOTICE` (Cloud Audit Log entries confirming `"Ready condition status changed to True for Service rajadhaniyam-api-production"`). **Zero `ERROR`/`WARNING`/`CRITICAL` entries, zero 5xx responses, zero Prisma/database/missing-env-var/auth errors found.**

### D. Storage check

Per Phase 13E, `SUPABASE_URL` is required only for admin image uploads (`apps/api/src/modules/uploads/storage.ts`) — **it was not included in this deployment** (kept identical to the Phase 13A-approved command, which mirrors staging's current gap). This means **admin product-image upload on production will fail with a 503** (`"Image upload isn't configured"`) until `SUPABASE_URL` is added as a non-secret env var. No write/upload test was performed (correctly out of scope for read-only verification). This is a known, pre-existing gap (same as staging), not a new regression from this deployment — flagged as a remaining blocker below.

### E. Rollback

Not needed — deployment succeeded cleanly on the first attempt. No changes made to Render, DNS, or Cloudflare as a result of this phase.

### Remaining blockers

1. ~~`SUPABASE_URL` still not set on production~~ — **resolved in Phase 15, see below.** Still not set on staging (unchanged, out of scope for this phase).
2. **Production Razorpay webhook still points at the wrong service** (`rajadhaniyam-storefront.onrender.com` instead of the API) — client's action, not blocking checkout today.
3. Production Cloud Run is deployed but **carries zero live customer traffic** — nothing points at it yet (no DNS, no Cloudflare Worker attached). It shares the same production Supabase database as staging and Render, so it's now a third consumer of that same data — harmless for reads, same shared-database caution applies to any future write-path testing against it.
4. Cloudflare production Worker and DNS cutover remain fully out of scope, exactly as instructed — not started.

Render, `rajadhaniyam.com`, Supabase, DNS, Cloudflare, and Razorpay configuration are all unchanged by this phase.

## Phase 15: `SUPABASE_URL` added to production Cloud Run (2026-09-17)

Single-variable change, exactly as scoped — no other env var, secret, DNS, Cloudflare, Render, Supabase, or Razorpay change made.

### A. Value verification

The value was **not guessed**. `SUPABASE_URL` for a Supabase project follows the fixed pattern `https://<project-ref>.supabase.co`; for project ref `okoalheebdrszwkiombn` (confirmed shared by staging/production in Phase 12A) that gives `https://okoalheebdrszwkiombn.supabase.co`. This was verified live and read-only: `GET https://okoalheebdrszwkiombn.supabase.co/rest/v1/` (no credentials sent) returned Supabase's standard `401 {"message":"No API key found in request", ...}` — the standard signature of a real, reachable Supabase project, not a DNS failure or unrelated host. No secret values involved or exposed.

### B. Applied

```
gcloud run services update rajadhaniyam-api-production \
  --region=asia-south1 --project=xyratek-websites \
  --update-env-vars=SUPABASE_URL=https://okoalheebdrszwkiombn.supabase.co
```
Used `--update-env-vars` (additive) rather than `--set-env-vars` (replaces the whole list) specifically so no existing env var or secret reference could be touched.

### C. Verification

1. **New revision created**: `rajadhaniyam-api-production-00002-28t` (previous: `-00001-wkk`).
2. **Ready**: `status.conditions` — `Ready: True`, `ConfigurationsReady: True`, `RoutesReady: True`. Cloud Audit Log confirms: `"Ready condition status changed to True for Revision rajadhaniyam-api-production-00002-28t ... Deploying revision succeeded in 5.46s"`.
3. **Public access intact**: `run.googleapis.com/invoker-iam-disabled` still `true` — untouched by this update.
4. **Env var list after the change** (names only): `NODE_ENV`, `STOREFRONT_URL`, `ADMIN_URL`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `PAYMENT_PROVIDER_KEY`, `PAYMENT_PROVIDER_SECRET`, **`SUPABASE_URL`** (new) — every previously existing entry confirmed still present, nothing removed or altered.

**Smoke tests** (all against the new revision, 100% traffic):

| Endpoint | Status | Result |
|---|---|---|
| `GET /health` | 200 | `{"success":true,"data":{"status":"ok"}}` |
| `GET /products` | 200 | Real product data, unchanged from pre-update |
| `GET /categories` | 200 | Real category data, unchanged |

No write/upload test performed, per instructions.

**Logs** (this revision, verification window, via Cloud Logging REST API — `gcloud logging read` hit a local Windows CLI quoting bug unrelated to Cloud Run, same workaround as Phase 14): 12 entries — 6 `INFO` (the 3 smoke-test requests + routine logging), 4 `WARNING`/404 (benign — a browser directly opened `GET /` and `GET /favicon.ico` on the raw `*.a.run.app` URL; the API has no such routes, so 404 is correct, expected behavior, not an error), 1 `NOTICE` deploy-succeeded audit entry. **Zero startup errors, zero missing-env-var errors, zero Supabase/Prisma/database errors, zero 5xx responses.**

### D. Confirmed unchanged

No database, data, DNS, Cloudflare, Render, or Razorpay changes occurred as part of this phase. `DATABASE_URL_PRODUCTION`, `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`, `JWT_SECRET_PRODUCTION`, `SESSION_SECRET_PRODUCTION`, both Razorpay production secrets, `STOREFRONT_URL`, `ADMIN_URL`, and CORS configuration are all exactly as they were after Phase 14.

### Remaining blockers

1. Production Razorpay webhook still misconfigured (client's action — unchanged from Phase 14).
2. `SUPABASE_URL` still not set on **staging** — out of scope for this phase, staging config unchanged.
3. No admin image-upload write test has been performed anywhere (staging or production) — deferred, since any such test would write real data to the shared production database/storage.
4. Cloudflare production Worker and DNS cutover remain untouched, exactly as instructed.

## Safety restrictions (standing, for every future session on this migration)

- Do not merge into `master`/`main`.
- Do not modify or delete the existing Cloudflare preview deployment.
- Do not modify production DNS (this covers `rajadhaniyam.in`, the confirmed project domain, once it's live).
- **`rajadhaniyam.com` is NOT this project's domain — it belongs to a separate, unrelated site with active GoDaddy email (MX/SPF). Never modify its DNS, hosting, or email under any circumstance, even by analogy/pattern-matching from `rajadhaniyam.in` work.**
- Do not modify the production Cloudflare deployment.
- Do not change the production Razorpay webhook, or create any webhook against the Cloud Run staging service.
- Do not use production Razorpay credentials in Cloud Run staging — test-mode keys only.
- Do not stop, delete, or modify the Render deployment.
- Do not run Prisma migrations against the production database without explicit approval.
- Do not change the Supabase database schema.
- Do not print secret values in terminal output, commits, or this file — names only.
- Do not commit `.env` files, credentials, or service-account keys.
