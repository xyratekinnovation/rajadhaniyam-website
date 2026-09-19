# Rajadhaniyam — Client Handover

**Date**: 2026-09-18
**Prepared by**: Xyratek Innovation

This document is the single reference for everything needed to access, understand, and operate the Rajadhaniyam website following its migration to a new hosting setup (Cloudflare + Google Cloud Run). It is written to be understandable without a technical background — technical detail is included separately in Section 11 for whoever maintains the site going forward.

---

## 1. Website

**Live customer website**: **https://rajadhaniyam.in**

This is the address customers use to browse and order. It also works with `www.`:

**https://www.rajadhaniyam.in** — automatically redirects to the address above (both work identically for a visitor).

---

## 2. Admin Panel

**Admin login**: **https://rajadhaniyam-admin.onrender.com**

This is where store products, orders, and customers are managed day to day.

---

## 3. Login Credentials

**CLIENT LOGIN CREDENTIALS**

| Field | Value |
|---|---|
| Admin URL | https://rajadhaniyam-admin.onrender.com |
| Email | `svtexim@gmail.com` |
| Password | *(provided separately, not in this document — see note below)* |

> **Why the password isn't written here**: this project's code repository is **public** on GitHub, and this document is committed to that repository. Storing a real password inside a public document would expose it to anyone on the internet. The password was set exactly as requested and confirmed working through the real admin login — it has been shared with you directly in chat instead of here. **We'd recommend changing it to something only you know once you've received it**, since it currently exists in this conversation's history.

An existing account used by Xyratek during development also remains active (`xyratekinnovation@gmail.com`) — this can be removed once you've confirmed your own account works and you no longer need Xyratek's direct access, at your discretion.

---

## 4. Important URLs

| # | URL | Purpose | Environment | Who uses it | Client-facing? |
|---|---|---|---|---|---|
| 1 | https://rajadhaniyam.in | Customer storefront | Production | Customers | Yes |
| 2 | https://www.rajadhaniyam.in | Redirects to #1 | Production | Customers | Yes |
| 3 | https://rajadhaniyam-admin.onrender.com | Store admin dashboard | Production | Store owner/staff | Yes (private login) |
| 4 | https://rajadhaniyam-api-production-855749773400.asia-south1.run.app | Backend API the storefront talks to | Production | Automatic (not visited directly) | No |
| 5 | https://rajadhaniyam-storefront-preview.xyratekinnovation.workers.dev | Pre-launch preview/staging site, used for testing before this migration went live | Staging | Developers only | No |
| 6 | https://rajadhaniyam-api-staging-855749773400.asia-south1.run.app | Backend API for the staging site above | Staging | Developers only | No |
| 7 | https://rajadhaniyam-storefront.onrender.com | Previous hosting (Render) — kept temporarily as a rollback safety net | Rollback | Developers only | No |
| 8 | https://rajadhaniyam-api.onrender.com | Previous backend API (Render) — same rollback purpose | Rollback | Developers only | No |

**You (the client) only need URLs #1–3.** The rest are developer/infrastructure addresses kept for testing and safety during the transition — they don't need to be shared further and will likely be retired once the new setup has proven stable for a while.

---

## 5. Hosting & Infrastructure

**Frontend (the website customers see)**
- Hosted on: **Cloudflare Workers**
- Worker name: `rajadhaniyam-storefront-production`
- Connected to your domain: `rajadhaniyam.in` (Cloudflare Custom Domain)

**Backend (the API that powers the site)**
- Hosted on: **Google Cloud Run**
- Service name: `rajadhaniyam-api-production`
- Google Cloud project: `xyratek-websites`
- Region: `asia-south1` (Mumbai)

**Database**
- Hosted on: **Supabase** (managed PostgreSQL)
- Project reference: `okoalheebdrszwkiombn` (this identifier is safe to share; it is not a password or secret)
- Database credentials, service-role keys, and connection strings are **not included here** — they're stored securely in Google Secret Manager, accessible only to whoever administers the Google Cloud project.

**Domain & DNS**
- Domain registrar: **GoDaddy** (where `rajadhaniyam.in` was purchased)
- DNS management: **Cloudflare** — `rajadhaniyam.in`'s nameservers point to Cloudflare, which handles routing traffic to the website and issuing its SSL certificate automatically. GoDaddy remains the registrar of record (renewals happen there); day-to-day DNS/routing changes happen in Cloudflare.

**Code repository**
- Migration work lives on branch: `migration/cloudflare-storefront`
- This branch has **not** been merged into `master` yet — `master` still reflects the pre-migration (Render-only) codebase, which is why the Render-hosted admin app doesn't yet show every small fix made during this migration (e.g. a cosmetic placeholder text difference — see Section 7). Merging this branch is a decision for the team to make once the new setup has been running stably.

**Payments**
- Provider: **Razorpay**
- Status: production credentials are configured, but **final verification has not been completed** — see Section 8.

---

## 6. Current Features

Verified working on the live production site (`https://rajadhaniyam.in`) as of this handover:

- Homepage, navigation, and footer
- Product listing (shop page) with category filtering and sorting
- Product detail pages, including images and quantity selection
- Shopping cart — add, update quantity, remove, live totals
- Checkout — contact details, shipping address, order summary
- **Cash on Delivery (COD)** checkout — verified end-to-end with a real test order, then cleaned up
- Customer login and registration pages
- Account/order history pages (correctly require login)
- Admin panel login and dashboard (products, orders, customers)
- Mobile and tablet responsive layout — tested on phone-width and tablet-width screens with no layout issues found

**Search — now working.** The search icon in the header opens a search box; searching shows matching products on the shop page (by name, category, or description, and tolerant of spelling like "ragi" vs "Raagi"). Search was a non-functional placeholder before this migration and was built and added on 2026-09-19 at the client's request.

---

## 7. Known / Pre-existing Issues

These existed before the migration and were not introduced by it:

1. **No Privacy Policy / Terms of Service pages** — the site doesn't currently have these pages or footer links to them. Worth adding before wide marketing, especially since the site accepts payments and collects customer addresses.
2. **Admin login page cosmetic text** — the admin panel's login screen shows a placeholder example email using `.com` instead of `.in`. Purely cosmetic (doesn't affect login), and will be resolved once the `migration/cloudflare-storefront` branch is merged into `master`.
3. **Two older, unresolved test orders were found** during this handover's data review and were **deliberately left untouched** pending your review: order `RJD21187244` (₹169, Kambu Broken) and `RJD23135541` (₹924, Family Pantry Combo), both dated 2026-09-10, both still "Pending" and never completed or cancelled. These use real products (not test items), so we did not assume they were test data — please check these two in the admin Orders list and cancel or fulfill them as appropriate.

---

## 8. Razorpay Status

**RAZORPAY FINAL VERIFICATION — DEFERRED**

Razorpay (the online payment provider for UPI/card/net banking) is configured with production credentials, but a full end-to-end payment test has not been completed. This requires **your** access to the Razorpay dashboard to confirm the account/webhook configuration is correct for the new domain before it can be verified safe for real customer payments.

**Cash on Delivery works today and has been tested.** Online payments (UPI/card/net banking) should be treated as **not yet confirmed production-ready** until this final Razorpay check is completed together.

---

## 9. Test Data Cleanup

As part of this handover, all development/testing data accumulated during the migration was reviewed and cleaned from the live database:

**Removed** (confirmed test data only):
- 9 test orders, all placed against a dedicated test product used only for verifying the checkout worked correctly during migration testing
- 1 test customer account used by the development team
- 1 test shopping cart session
- The dedicated test product itself (was never a real catalog item)

**Left untouched, for your review** (see Section 7, item 3):
- 2 older orders using real products that couldn't be confidently confirmed as test data

**Preserved, unaffected**:
- All 10 real catalog products and their stock levels
- Both admin accounts (yours and Xyratek's)
- No genuine customer data existed to preserve or lose — the database contained no real customer orders at the time of this handover.

---

## 10. Client Responsibilities

Going forward, these are yours to manage:

- **Razorpay account** — dashboard access, webhook configuration, and final payment verification (Section 8)
- **Domain renewal** — `rajadhaniyam.in` is registered through GoDaddy; renewal reminders will come from GoDaddy directly
- **Admin panel** — day-to-day product, order, and customer management
- **Deciding on the two pending orders** flagged in Section 7
- **Deciding when/whether** to change the shared admin password, and whether to keep or remove Xyratek's admin account access

---

## 11. Technical Notes

*(For whoever maintains the codebase — safe to skip if you're not technical.)*

- Monorepo (Bun workspaces): `apps/api` (Hono API), `apps/storefront` (TanStack Start SSR, deployed as a Cloudflare Worker), `apps/admin` (Vite/React, deployed on Render).
- Migration work is entirely on git branch `migration/cloudflare-storefront` (current commit `2762de9` at time of writing) — never merged into `master`.
- Production Cloud Run service (`rajadhaniyam-api-production`) and staging (`rajadhaniyam-api-staging`) currently share the **same Supabase database** — this was a deliberate interim decision during migration, not a bug, but worth knowing before running any test data against staging in the future, since it will affect production.
- Secrets (`DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, Razorpay keys, Supabase service-role key) are stored in Google Secret Manager under project `xyratek-websites`, with `_PRODUCTION`-suffixed names for the production set — never in source control or this document.
- Full phase-by-phase migration history, including every infrastructure decision made and why, is recorded in `docs/GCP_MIGRATION_STATUS.md` in this repository.

---

## 12. Post-Handover Recommendations

- Complete the Razorpay final verification before promoting online payments to customers (Section 8).
- Add Privacy Policy / Terms of Service pages, especially given the site handles payments and customer addresses.
- Review and resolve the two pending orders flagged in Section 7.
- Once the new Cloudflare + Cloud Run setup has run stably for a period you're comfortable with, consider merging `migration/cloudflare-storefront` into `master` so the admin app and any future Render deployments stay fully in sync, and consider decommissioning the old Render storefront/API rollback services (URLs #7–8 in Section 4) to simplify the infrastructure.
