import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Btn, Eyebrow } from "@/components/site/ui";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/shop-data";

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

const field = "h-11 w-full border border-input bg-paper px-4 text-sm outline-none focus:border-olive";

function Checkout() {
  const { lines, subtotal, shipping, total, clear } = useCart();
  const navigate = useNavigate();
  const [pay, setPay] = useState("upi");

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <Eyebrow>Step 2 of 3</Eyebrow>
        <h1 className="mt-4 font-display text-5xl">Checkout</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            clear();
            navigate({ to: "/order-success" });
          }}
          className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]"
        >
          <div className="space-y-10">
            <section className="border border-border bg-paper p-6">
              <h2 className="font-display text-2xl">Contact</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input required placeholder="Full name" className={field} />
                <input required type="email" placeholder="Email address" className={field} />
                <input required type="tel" placeholder="Phone number" className={`${field} sm:col-span-2`} />
              </div>
            </section>

            <section className="border border-border bg-paper p-6">
              <h2 className="font-display text-2xl">Shipping Address</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input required placeholder="Address line 1" className={`${field} sm:col-span-2`} />
                <input placeholder="Address line 2 (optional)" className={`${field} sm:col-span-2`} />
                <input required placeholder="City" className={field} />
                <input required placeholder="State" className={field} />
                <input required placeholder="PIN code" className={field} />
                <input defaultValue="India" readOnly className={field} />
              </div>
            </section>

            <section className="border border-border bg-paper p-6">
              <h2 className="font-display text-2xl">Payment</h2>
              <div className="mt-5 space-y-3">
                {[
                  ["upi", "UPI / GPay / PhonePe"],
                  ["card", "Credit or Debit Card"],
                  ["netbanking", "Net Banking"],
                  ["cod", "Cash on Delivery (+₹25)"],
                ].map(([v, label]) => (
                  <label
                    key={v}
                    className={`flex cursor-pointer items-center gap-3 border p-4 text-sm ${
                      pay === v ? "border-olive bg-olive/5" : "border-input"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      value={v}
                      checked={pay === v}
                      onChange={() => setPay(v)}
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
            <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : inr(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-display text-2xl">
                <dt>Total</dt>
                <dd className="text-olive">{inr(total)}</dd>
              </div>
            </dl>
            <Btn type="submit" className="mt-6 w-full" disabled={lines.length === 0}>
              Place Order
            </Btn>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}
