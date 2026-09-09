// Admin is now a separate app (apps/admin), not a route inside the
// storefront — so this is a plain cross-app link, not a TanStack Router route.
export const ADMIN_URL: string = import.meta.env["VITE_ADMIN_URL"] ?? "http://localhost:4001";
