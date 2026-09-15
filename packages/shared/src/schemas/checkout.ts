import { z } from "zod";

export const checkoutContactSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter a valid phone number"),
});

export const checkoutAddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(4, "Enter a valid PIN code"),
  country: z.string().default("India"),
});

export const paymentMethodSchema = z.enum(["upi", "card", "netbanking", "cod"]);

export const checkoutSchema = z.object({
  contact: checkoutContactSchema,
  address: checkoutAddressSchema,
  paymentMethod: paymentMethodSchema,
  couponCode: z.string().optional(),
});

export const couponCodeSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

/** Client → POST /payments/verify after Razorpay Checkout success. */
export const paymentVerifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PaymentVerifyInput = z.infer<typeof paymentVerifySchema>;
