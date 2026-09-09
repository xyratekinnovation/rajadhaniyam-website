import type { Banner, HomepageHero } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

export const contentApi = {
  getHero: () => apiGet<HomepageHero | null>("/content/hero"),
  getBanners: () => apiGet<Banner[]>("/content/banners"),
};
