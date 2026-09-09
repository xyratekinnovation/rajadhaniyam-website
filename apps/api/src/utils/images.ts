import { env } from "../config/env";

// Seeded/admin-entered rows can store either a relative path (served as a
// static file — see docs/DEPLOYMENT.md's image-hosting note) or an already-
// absolute URL (a real upload or hosted image). Only relative ones need the
// storefront origin prefixed, or a real URL would get mangled into garbage.
export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${env.STOREFRONT_URL}${path}`;
}
