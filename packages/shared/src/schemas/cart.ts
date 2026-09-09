import { z } from "zod";

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  image: z.string(),
  weight: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive(),
});

export const addToCartSchema = z.object({
  productId: z.string(),
  weight: z.string().optional(),
  qty: z.number().int().positive().default(1),
});
