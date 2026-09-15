/** Default product name (case-insensitive) that skips the base shipping fee. */
export const SHIPPING_WAIVED_PRODUCT_NAME = "test";

/**
 * True when the cart has items and every product matches `waivedProductName`
 * (case-insensitive). Empty waived name disables the exception.
 */
export function isShippingWaivedForProducts(
  productNames: string[],
  waivedProductName: string = SHIPPING_WAIVED_PRODUCT_NAME,
): boolean {
  const waived = waivedProductName.trim().toLowerCase();
  if (!waived || productNames.length === 0) return false;
  return productNames.every((name) => name.trim().toLowerCase() === waived);
}
