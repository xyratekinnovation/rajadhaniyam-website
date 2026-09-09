import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default("dev-only-insecure-secret"),
  SESSION_SECRET: z.string().default("dev-only-insecure-secret"),
  STOREFRONT_URL: z.string().default("http://localhost:8080"),
  ADMIN_URL: z.string().default("http://localhost:4001"),
  PAYMENT_PROVIDER_KEY: z.string().optional(),
  PAYMENT_PROVIDER_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
