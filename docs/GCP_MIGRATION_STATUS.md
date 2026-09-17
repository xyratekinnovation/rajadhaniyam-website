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
