import { Hono } from "hono";
import { ok, notImplemented } from "../../utils/response";
import { requireAdminAuth } from "../../middleware/auth";

// Homepage banners, editable content sections and contact-form enquiries.
export const contentRoutes = new Hono();

contentRoutes.get("/banners", (c) => c.json(ok([])));
contentRoutes.post("/banners", requireAdminAuth, (c) =>
  c.json(notImplemented("Banner creation"), 501),
);

contentRoutes.post("/contact", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.message) {
    return c.json({ success: false, message: "email and message are required" }, 400);
  }
  return c.json(notImplemented("Contact enquiry submission"), 501);
});

contentRoutes.get("/contact", requireAdminAuth, (c) => c.json(ok([])));
