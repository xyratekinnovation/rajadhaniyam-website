import { prisma } from "@rajadhaniyam/database";
import type { Banner, BannerInput, HomepageHero, HomepageHeroInput } from "@rajadhaniyam/shared";
import { HttpError } from "../../middleware/errorHandler";
import { absoluteUrl } from "../../utils/images";

const HOMEPAGE_HERO_KEY = "homepage_hero";

function toBanner(row: {
  id: string;
  title: string;
  image: string;
  link: string | null;
  position: number;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}): Banner {
  return {
    id: row.id,
    title: row.title,
    image: absoluteUrl(row.image),
    link: row.link ?? undefined,
    position: row.position,
    active: row.active,
    startsAt: row.startsAt?.toISOString(),
    endsAt: row.endsAt?.toISOString(),
  };
}

export const contentService = {
  // ---------- Homepage hero (SiteContent, key-value) ----------

  // undefined means "no override saved yet" — the storefront falls back to
  // its own hardcoded copy in that case, rather than the API needing to
  // know what that fallback text is.
  getHero: async (): Promise<HomepageHero | undefined> => {
    const row = await prisma.siteContent.findUnique({ where: { key: HOMEPAGE_HERO_KEY } });
    if (!row) return undefined;
    const hero = row.value as HomepageHero;
    return { ...hero, image: absoluteUrl(hero.image) };
  },

  setHero: async (input: HomepageHeroInput): Promise<HomepageHero> => {
    const row = await prisma.siteContent.upsert({
      where: { key: HOMEPAGE_HERO_KEY },
      create: { key: HOMEPAGE_HERO_KEY, value: input },
      update: { value: input },
    });
    const hero = row.value as HomepageHero;
    return { ...hero, image: absoluteUrl(hero.image) };
  },

  // ---------- Banners ----------

  // Public — only active banners whose date window (if any) includes now.
  listActiveBanners: async (): Promise<Banner[]> => {
    const now = new Date();
    const rows = await prisma.banner.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { position: "asc" },
    });
    return rows.map(toBanner);
  },

  // ---------- Admin ----------

  listAllBanners: async (): Promise<Banner[]> => {
    const rows = await prisma.banner.findMany({ orderBy: { position: "asc" } });
    return rows.map(toBanner);
  },

  createBanner: async (input: BannerInput): Promise<Banner> => {
    const row = await prisma.banner.create({
      data: {
        title: input.title,
        image: input.image,
        link: input.link,
        position: input.position,
        active: input.active,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
      },
    });
    return toBanner(row);
  },

  updateBanner: async (id: string, input: BannerInput): Promise<Banner> => {
    const row = await prisma.banner
      .update({
        where: { id },
        data: {
          title: input.title,
          image: input.image,
          link: input.link ?? null,
          position: input.position,
          active: input.active,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        },
      })
      .catch(() => {
        throw new HttpError(404, "Banner not found");
      });
    return toBanner(row);
  },

  removeBanner: async (id: string): Promise<void> => {
    await prisma.banner.delete({ where: { id } }).catch(() => {
      throw new HttpError(404, "Banner not found");
    });
  },
};
