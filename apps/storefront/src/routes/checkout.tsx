import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { COD_SURCHARGE, type CheckoutInput } from "@rajadhaniyam/shared";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Btn, Eyebrow } from "@/components/site/ui";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { inr } from "@/lib/shop-data";
import { checkoutApi, paymentsApi } from "@/services/api/checkout";
import { couponsApi } from "@/services/api/coupons";
import { ApiError } from "@/services/api/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Rajadhaniyam" },
      { name: "description", content: "Complete your Rajadhaniyam order with secure checkout." },
      { property: "og:title", content: "Checkout — Rajadhaniyam" },
      { property: "og:description", content: "Secure checkout for your millet pantry order." },
    ],
  }),
  component: Checkout,
});

const field =
  "h-11 w-full border border-input bg-paper px-4 text-sm outline-none focus:border-olive";

const PAYMENT_OPTIONS: { value: CheckoutInput["paymentMethod"]; label: string }[] = [
  { value: "upi", label: "UPI / GPay / PhonePe" },
  { value: "card", label: "Credit or Debit Card" },
  { value: "netbanking", label: "Net Banking" },
  { value: "cod", label: `Cash on Delivery (+${inr(COD_SURCHARGE)})` },
];

function Checkout() {
  const { lines, subtotal, shipping, total, clear } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutInput["paymentMethod"]>("upi");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponError(null);
    setIsApplyingCoupon(true);
    try {
      const { coupon, discount } = await couponsApi.validate(couponInput.trim(), subtotal);
      setAppliedCoupon({ code: coupon.code, discount });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof ApiError ? err.message : "Couldn't apply this coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  // A coupon applied before the cart changed (item added/removed/qty
  // adjusted) could now compute a different discount than what's shown —
  // the server re-validates independently at submission regardless (see
  // orders.service.ts), so this only affects the on-page preview, not what
  // actually gets charged.
  const codFee = paymentMethod === "cod" ? COD_SURCHARGE : 0;
  const grandTotal = total + codFee - (appliedCoupon?.discount ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await checkoutApi.createOrder({
        contact: { fullName, email, phone },
        address: { line1, line2: line2 || undefined, city, state, postalCode, country: "India" },
        paymentMethod,
        couponCode: appliedCoupon?.code,
      });

      if (result.razorpay) {
        try {
          const payment = await openRazorpayCheckout(result.razorpay);
          await paymentsApi.verify({
            orderId: result.order.id,
            razorpayOrderId: payment.razorpay_order_id,
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpaySignature: payment.razorpay_signature,
          });
        } catch (payErr) {
          setError(
            payErr instanceof Error && payErr.message === "Payment cancelled"
              ? "Payment was cancelled. Your order is unpaid — please try again from checkout, or choose Cash on Delivery."
              : payErr instanceof ApiError
                ? payErr.message
                : "Payment could not be completed. Please try again or choose Cash on Delivery.",
          );
          return;
        }
      }

      clear();
      navigate({ to: "/order-success", search: { orderNumber: result.order.orderNumber } });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong placing your order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <Eyebrow>Step 2 of 3</Eyebrow>
        <h1 className="mt-4 font-display text-5xl">Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-10">
            <section className="border border-border bg-paper p-6">
              <h2 className="font-display text-2xl">Contact</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={field}
                />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={field}
                />
                <input
                  required
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${field} sm:col-span-2`}
                />
              </div>
            </section>

            <section className="border border-border bg-paper p-6">
              <h2 className="font-display text-2xl">Shipping Address</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="Address line 1"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className={`${field} sm:col-span-2`}
                />
                <input
                  placeholder="Address line 2 (optional)"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className={`${field} sm:col-span-2`}
                />
                <input
                  required
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={field}
                />
                <input
                  required
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={field}
                />
                <input
                  required
                  placeholder="PIN code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={field}
                />
                <input defaultValue="India" readOnly className={field} />
              </div>
            </section>

            <section className="border border-border bg-paper p-6">
              <h2 className="font-display text-2xl">Payment</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Pay securely online with UPI, card, or net banking — or choose Cash on Delivery.
              </p>
              <div className="mt-5 space-y-3">
                {PAYMENT_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 border p-4 text-sm ${
                      paymentMethod === value
                        ? "border-olive bg-olive/5"
                        : "border-input hover:border-olive/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      value={value}
                      checked={paymentMethod === value}
                      onChange={() => setPaymentMethod(value)}
                      className="accent-olive"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit border border-border bg-ivory p-6">
            <h2 className="font-display text-2xl">Your Order</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {lines.map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {l.name} × {l.qty}
                  </span>
                  <span>{inr(l.price * l.qty)}</span>
                </li>
              ))}
              {lines.length === 0 ? (
                <li className="text-muted-foreground">Your cart is empty.</li>
              ) : null}
            </ul>
            <div className="mt-5 border-t border-border pt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 border border-olive/40 bg-olive/5 px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium text-olive">{appliedCoupon.code}</span> applied
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput("");
                    }}
                    className="text-xs text-muted-foreground underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="h-10 flex-1 border border-input bg-paper px-3 text-sm outline-none focus:border-olive"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponInput.trim()}
                    className="h-10 border border-olive px-4 text-xs font-semibold uppercase tracking-wide text-olive hover:bg-olive/5 disabled:opacity-50"
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {couponError ? <p className="mt-2 text-xs text-destructive">{couponError}</p> : null}
            </div>

            <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : inr(shipping)}</dd>
              </div>
              {paymentMethod === "cod" ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cash on Delivery fee</dt>
                  <dd>{inr(COD_SURCHARGE)}</dd>
                </div>
              ) : null}
              {appliedCoupon ? (
                <div className="flex justify-between text-olive">
                  <dt>Discount ({appliedCoupon.code})</dt>
                  <dd>-{inr(appliedCoupon.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-3 font-display text-2xl">
                <dt>Total</dt>
                <dd className="text-olive">{inr(grandTotal)}</dd>
              </div>
            </dl>
            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
            <Btn type="submit" className="mt-6 w-full" disabled={lines.length === 0 || isSubmitting}>
              {isSubmitting
                ? paymentMethod === "cod"
                  ? "Placing Order..."
                  : "Processing Payment..."
                : paymentMethod === "cod"
                  ? "Place Order"
                  : "Pay Securely"}
            </Btn>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}
