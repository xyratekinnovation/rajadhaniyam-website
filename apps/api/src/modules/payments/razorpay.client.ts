import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env";
import { HttpError } from "../../middleware/errorHandler";

export function assertRazorpayConfigured(): { keyId: string; keySecret: string } {
  const keyId = env.PAYMENT_PROVIDER_KEY?.trim();
  const keySecret = env.PAYMENT_PROVIDER_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new HttpError(
      503,
      "Online payment isn't configured yet — please choose Cash on Delivery, or try again later",
    );
  }
  return { keyId, keySecret };
}

export function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = assertRazorpayConfigured();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/** Verify Checkout success signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  const { keySecret } = assertRazorpayConfigured();
  const expected = createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
  } catch {
    return false;
  }
}

/** Verify webhook body signature with the webhook signing secret. */
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function createRazorpayOrder(opts: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const client = getRazorpayClient();
  // Razorpay amounts are integer paise.
  const amountPaise = Math.round(opts.amountInr * 100);
  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: opts.receipt.slice(0, 40),
    notes: opts.notes,
  });
  return {
    id: order.id,
    amount: typeof order.amount === "string" ? Number(order.amount) : order.amount,
    currency: order.currency ?? "INR",
  };
}
