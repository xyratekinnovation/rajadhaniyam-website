import type { Address } from "./customer";

export type OrderStatus =
  "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  variantWeight: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  couponCode?: string;
  createdAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  description?: string;
  type: "percentage" | "flat";
  value: number;
  minOrderValue?: number;
  active: boolean;
  expiresAt?: string;
};

/** Client payload to open Razorpay Checkout after POST /checkout (online methods). */
export type RazorpayCheckoutPayload = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  /** Preferred Checkout method matching the selected paymentMethod. */
  preferMethod: "upi" | "card" | "netbanking";
};

/** Response from POST /checkout — includes Razorpay fields when paying online. */
export type CheckoutResult = {
  order: Order;
  razorpay?: RazorpayCheckoutPayload;
};
