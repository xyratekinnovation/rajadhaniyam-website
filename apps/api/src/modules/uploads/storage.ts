import { env } from "../../config/env";
import { HttpError } from "../../middleware/errorHandler";

// Talks to Supabase Storage's REST API directly (https://supabase.com/docs/guides/storage) —
// deliberately not the @supabase/supabase-js SDK, since uploading a single file and
// building a public URL doesn't need a full client library as a new dependency.
export const PRODUCT_IMAGES_BUCKET = "product-images";

function requireSupabaseConfig() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(
      503,
      "Image upload isn't configured — SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY missing",
    );
  }
  return { url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_ROLE_KEY };
}

// Idempotent — called once from scripts/setup-storage.ts, not on every API boot.
export async function ensureBucketExists(bucket: string): Promise<void> {
  const { url, key } = requireSupabaseConfig();

  const existing = await fetch(`${url}/storage/v1/bucket/${bucket}`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  if (existing.ok) return;

  const created = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: bucket, name: bucket, public: true }),
  });
  if (!created.ok) {
    throw new Error(`Failed to create Supabase Storage bucket "${bucket}": ${await created.text()}`);
  }
}

export async function uploadFile(
  bucket: string,
  path: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const { url, key } = requireSupabaseConfig();

  const response = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });

  if (!response.ok) {
    throw new HttpError(502, `Image upload failed: ${await response.text()}`);
  }

  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
