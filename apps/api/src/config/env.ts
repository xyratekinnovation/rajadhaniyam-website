import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Render (and most PaaS hosts) assign the port via PORT and expect the app to bind to it;
  // API_PORT stays the override for local dev where PORT isn't set.
  API_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(Number(process.env.PORT) || 4000),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  JWT_SECRET: z.string().default("dev-only-insecure-secret"),
  SESSION_SECRET: z.string().default("dev-only-insecure-secret"),
  STOREFRONT_URL: z.string().default("http://localhost:8080"),
  ADMIN_URL: z.string().default("http://localhost:4001"),
  // Optional comma-separated extra browser origins for CORS (e.g. Cloudflare
  // Workers preview). Does not replace STOREFRONT_URL / ADMIN_URL.
  EXTRA_CORS_ORIGINS: z.string().optional(),
  // Razorpay Key ID / Key Secret (PAYMENT_PROVIDER_* names kept for Render/env continuity).
  PAYMENT_PROVIDER_KEY: z.string().optional(),
  PAYMENT_PROVIDER_SECRET: z.string().optional(),
  // Webhook signing secret from Razorpay Dashboard → Webhooks (optional until configured).
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
