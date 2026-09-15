import type { RazorpayCheckoutPayload } from "@rajadhaniyam/shared";

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: RazorpayCheckoutPayload["prefill"];
  method?: Record<string, boolean>;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only open in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

/** Open Razorpay Checkout; resolves with payment ids/signature or rejects on dismiss. */
export async function openRazorpayCheckout(
  payload: RazorpayCheckoutPayload,
): Promise<RazorpaySuccessResponse> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout failed to load");
  }

  const prefer = payload.preferMethod;

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: payload.keyId,
      amount: payload.amount,
      currency: payload.currency,
      name: payload.name,
      description: payload.description,
      order_id: payload.orderId,
      prefill: payload.prefill,
      method: {
        upi: prefer === "upi",
        card: prefer === "card",
        netbanking: prefer === "netbanking",
      },
      theme: { color: "#556B2F" },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });
    rzp.open();
  });
}
