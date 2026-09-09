import type { Context, Next } from "hono";
import { HttpError } from "./errorHandler";

// In-memory fixed-window limiter. Good enough for a single Render instance;
// if the API ever scales to multiple instances, this needs to move to a
// shared store (Redis/Postgres) since each instance would otherwise track
// its own counters and the effective limit would multiply by instance count.
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(c: Context): string {
  // Render terminates TLS at a proxy and forwards the real client IP via
  // x-forwarded-for (first entry in the list); fall back to a constant so
  // local dev/tests without the header still share one bucket rather than
  // throwing.
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return "unknown";
}

export function rateLimit(options: { windowMs: number; max: number; name: string }) {
  return async (c: Context, next: Next) => {
    const key = `${options.name}:${clientIp(c)}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      await next();
      return;
    }

    if (bucket.count >= options.max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfterSeconds));
      throw new HttpError(429, "Too many requests, please try again later");
    }

    bucket.count += 1;
    await next();
  };
}
