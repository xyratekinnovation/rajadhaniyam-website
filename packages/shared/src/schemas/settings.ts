import { z } from "zod";
import {
  COD_SURCHARGE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "../constants";
import { SHIPPING_WAIVED_PRODUCT_NAME } from "../utils/shipping";

export const shippingSettingsSchema = z.object({
  standardShippingFee: z.number().nonnegative(),
  freeShippingThreshold: z.number().nonnegative(),
  codSurcharge: z.number().nonnegative(),
  /** Product name (case-insensitive) that skips base shipping when cart is only that product. Empty disables. */
  shippingWaivedProductName: z.string().trim().default(SHIPPING_WAIVED_PRODUCT_NAME),
});

export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;
export type ShippingSettingsInput = z.infer<typeof shippingSettingsSchema>;

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  standardShippingFee: STANDARD_SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  codSurcharge: COD_SURCHARGE,
  shippingWaivedProductName: SHIPPING_WAIVED_PRODUCT_NAME,
};
