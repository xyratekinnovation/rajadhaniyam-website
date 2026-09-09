import { z } from "zod";

export const bannerInputSchema = z.object({
  title: z.string().min(1),
  image: z.string().min(1),
  link: z.string().optional(),
  position: z.number().int().default(0),
  active: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const homepageHeroInputSchema = z.object({
  eyebrow: z.string().min(1),
  heading: z.string().min(1),
  headingAccent: z.string().min(1),
  subtitle: z.string().min(1),
  image: z.string().min(1),
  ctaText: z.string().min(1),
  ctaLink: z.string().min(1),
});

export type BannerInput = z.infer<typeof bannerInputSchema>;
export type HomepageHeroInput = z.infer<typeof homepageHeroInputSchema>;
