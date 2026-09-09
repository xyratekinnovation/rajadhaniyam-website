# @rajadhaniyam/ui

Seed package for cross-app UI primitives. Today it holds only the shared
`cn()` classname helper.

The storefront's full shadcn/Radix component set (`apps/storefront/src/components/ui`)
is intentionally **not** moved here yet — it is deeply wired to that app's
Tailwind theme and `components.json`, and the admin app's UI needs are still
placeholder-level. Extracting a real shared component library (Button, Input,
Table, Dialog, etc.) is a good candidate for a later phase once admin's
design requirements stabilize — see `docs/DEVELOPMENT_ROADMAP.md`.
