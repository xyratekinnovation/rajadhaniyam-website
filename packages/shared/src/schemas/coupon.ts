import { z } from "zod";

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .min(1)
      .transform((s) => s.trim().toUpperCase()),
    description: z.string().optional(),
    type: z.enum(["percentage", "flat"]),
    value: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional(),
    active: z.boolean().default(true),
    expiresAt: z.string().datetime().optional(),
  })
  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    message: "A percentage discount can't exceed 100",
    path: ["value"],
  });

export type CouponInput = z.infer<typeof couponInputSchema>;
