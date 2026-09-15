import { prisma } from "@rajadhaniyam/database";
import {
  DEFAULT_SHIPPING_SETTINGS,
  shippingSettingsSchema,
  type ShippingSettings,
  type ShippingSettingsInput,
} from "@rajadhaniyam/shared";

const SHIPPING_KEY = "shipping";

function parseShipping(value: unknown): ShippingSettings {
  const parsed = shippingSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_SHIPPING_SETTINGS;
}

export const settingsService = {
  /** Always returns a full settings object — DB override merged with defaults. */
  getShipping: async (): Promise<ShippingSettings> => {
    const row = await prisma.siteContent.findUnique({ where: { key: SHIPPING_KEY } });
    if (!row) return { ...DEFAULT_SHIPPING_SETTINGS };
    return parseShipping(row.value);
  },

  setShipping: async (input: ShippingSettingsInput): Promise<ShippingSettings> => {
    const value = shippingSettingsSchema.parse(input);
    await prisma.siteContent.upsert({
      where: { key: SHIPPING_KEY },
      create: { key: SHIPPING_KEY, value },
      update: { value },
    });
    return value;
  },
};
