import type { ShippingSettings } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

export const settingsApi = {
  getShipping: () => apiGet<ShippingSettings>("/settings/shipping"),
};
