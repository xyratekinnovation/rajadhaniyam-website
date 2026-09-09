import type { Banner, BannerInput, HomepageHero, HomepageHeroInput } from "@rajadhaniyam/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export const contentApi = {
  getHero: () => apiGet<HomepageHero | null>("/content/hero"),
  setHero: (input: HomepageHeroInput) => apiPatch<HomepageHero>("/content/hero", input),
};

export const bannersApi = {
  list: () => apiGet<Banner[]>("/banners"),
  create: (input: BannerInput) => apiPost<Banner>("/banners", input),
  update: (id: string, input: BannerInput) => apiPatch<Banner>(`/banners/${id}`, input),
  remove: (id: string) => apiDelete<null>(`/banners/${id}`),
};
