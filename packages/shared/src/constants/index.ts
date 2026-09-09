export const FREE_SHIPPING_THRESHOLD = 499;
export const STANDARD_SHIPPING_FEE = 49;
export const COD_SURCHARGE = 25;

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const PRODUCT_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export const PAYMENT_METHODS = {
  UPI: "upi",
  CARD: "card",
  NETBANKING: "netbanking",
  COD: "cod",
} as const;
