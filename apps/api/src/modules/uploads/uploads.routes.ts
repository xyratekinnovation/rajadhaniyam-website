import { Hono } from "hono";
import { requireAdminAuth } from "../../middleware/auth";
import { HttpError } from "../../middleware/errorHandler";
import { ok } from "../../utils/response";
import { uploadFile, PRODUCT_IMAGES_BUCKET } from "./storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Mounted at /admin/uploads — same foundation-only requireAdminAuth caveat
// as products.admin.routes.ts / categories.admin.routes.ts.
export const uploadsRoutes = new Hono();
uploadsRoutes.use("*", requireAdminAuth);

uploadsRoutes.post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;

  if (!(file instanceof File)) {
    throw new HttpError(400, "No file uploaded — expected multipart field \"file\"");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new HttpError(400, `Unsupported file type "${file.type}" — use JPEG, PNG, WebP or GIF`);
  }
  if (file.size > MAX_BYTES) {
    throw new HttpError(400, "File too large — max 5 MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `products/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const url = await uploadFile(PRODUCT_IMAGES_BUCKET, path, bytes, file.type);

  return c.json(ok({ url }), 201);
});
