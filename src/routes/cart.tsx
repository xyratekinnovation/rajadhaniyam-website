import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BtnLink, Eyebrow } from "@/components/site/ui";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/lib/cart";
import { inr } from "@/lib/shop-data";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Rajadhaniyam" },
      { name: "description", content: "Review the millets, flours and nuts in your Rajadhaniyam cart." },
      { property: "og:title", content: "Your Cart — Rajadhaniyam" },
      { property: "og:description", content: "Review your Rajadhaniyam order before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal, shipping, total } = useCart();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <Eyebrow>Step 1 of 3</Eyebrow>
        <h1 className="mt-4 font-display text-5xl">Shopping Cart</h1>

        {lines.length === 0 ? (
          <div className="mt-16 border border-border bg-paper py-20 text-center">
            <p className="text-sm text-muted-foreground">Your cart is currently empty.</p>
            <BtnLink to="/shop" className="mt-6">
              Start Shopping
            </BtnLink>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
            <div className="border border-border bg-paper">
              {lines.map((l) => (
                <div key={l.id} className="flex gap-5 border-b border-border p-5 last:border-0">
                  <img src={l.image} alt={l.name} loading="lazy" className="h-28 w-24 object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.weight}</p>
                      </div>
                      <button onClick={() => remove(l.id)} aria-label={`Remove ${l.name}`}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-terracotta" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center border border-input">
                        <button className="px-3 py-1.5" onClick={() => setQty(l.id, l.qty - 1)} aria-label="Decrease">
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm">{l.qty}</span>
                        <button className="px-3 py-1.5" onClick={() => setQty(l.id, l.qty + 1)} aria-label="Increase">
                          +
                        </button>
                      </div>
                      <span className="font-display text-xl text-olive">{inr(l.price * l.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit border border-border bg-ivory p-6">
              <h2 className="font-display text-2xl">Order Summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
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
              <BtnLink to="/checkout" className="mt-6 w-full">
                Checkout
              </BtnLink>
              <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
                Free shipping above {inr(FREE_SHIPPING_THRESHOLD)}
              </p>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
