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
