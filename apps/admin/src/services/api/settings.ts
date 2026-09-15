import type { ShippingSettings, ShippingSettingsInput } from "@rajadhaniyam/shared";
import { apiGet, apiPatch } from "./client";

export const settingsApi = {
  getShipping: () => apiGet<ShippingSettings>("/settings/shipping"),
  setShipping: (input: ShippingSettingsInput) =>
    apiPatch<ShippingSettings>("/settings/shipping", input),
};
