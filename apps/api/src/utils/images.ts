import { env } from "../config/env";

// Seeded/admin-entered rows can store either a relative path (served as a
// static file — see docs/DEPLOYMENT.md's image-hosting note) or an already-
// absolute URL (a real upload or hosted image). Only relative ones need the
// storefront origin prefixed, or a real URL would get mangled into garbage.
export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${env.STOREFRONT_URL}${path}`;
}

// The inverse of absoluteUrl — admin forms (hero, banners) fetch the current
// value through a GET that's already been through absoluteUrl(), then
// resubmit that same value on save if the image field wasn't touched. Without
// unwrapping it back to relative first, a relative path saved once becomes a
// hardcoded absolute URL on every subsequent edit, baking in whichever
// server's STOREFRONT_URL happened to handle that particular save — broken
// on any other environment sharing the same database. Only unwraps URLs
// pointing at our own storefront; a real external/uploaded URL is untouched.
export function toStoredPath(url: string): string {
  return url.startsWith(env.STOREFRONT_URL) ? url.slice(env.STOREFRONT_URL.length) : url;
}
