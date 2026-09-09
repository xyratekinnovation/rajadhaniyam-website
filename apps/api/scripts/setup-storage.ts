// One-time setup: creates the Supabase Storage bucket product images upload
// to. Idempotent (safe to re-run — no-ops if the bucket already exists).
//
// Run with: bun run --cwd=apps/api setup-storage
import { ensureBucketExists, PRODUCT_IMAGES_BUCKET } from "../src/modules/uploads/storage";

await ensureBucketExists(PRODUCT_IMAGES_BUCKET);
console.log(`Bucket "${PRODUCT_IMAGES_BUCKET}" is ready.`);
