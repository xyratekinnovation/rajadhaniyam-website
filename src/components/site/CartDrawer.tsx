import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD, useCart } from "@/lib/cart";
import { inr } from "@/lib/shop-data";
import { Btn, BtnLink } from "./ui";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal, shipping, total } = useCart();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-gold/40 bg-paper transition-transform duration-400 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-2xl">Your Cart</h2>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="p-1">
            <X className="h-5 w-5" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <BtnLink to="/shop" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Browse the Shop
            </BtnLink>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {lines.map((l) => (
              <div key={l.id} className="flex gap-4">
                <img
                  src={l.image}
                  alt={l.name}
                  loading="lazy"
                  className="h-24 w-20 shrink-0 object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-display text-lg">{l.name}</p>
                    <button
                      onClick={() => remove(l.id)}
                      aria-label={`Remove ${l.name}`}
                      className="shrink-0 text-muted-foreground hover:text-terracotta"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">{l.weight}</span>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border border-border">
                      <button
                        className="px-2 py-1.5"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(l.id, l.qty - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm">{l.qty}</span>
                      <button
                        className="px-2 py-1.5"
                        aria-label="Increase quantity"
                        onClick={() => setQty(l.id, l.qty + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-display text-lg text-olive">{inr(l.price * l.qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 ? (
          <footer className="space-y-4 border-t border-border bg-ivory px-6 py-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free" : inr(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-xl">
                <span>Total</span>
                <span className="text-olive">{inr(total)}</span>
              </div>
            </div>
            <BtnLink to="/checkout" className="w-full" onClick={() => setOpen(false)}>
              Proceed to Checkout
            </BtnLink>
            <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
              <span>Free shipping on orders above {inr(FREE_SHIPPING_THRESHOLD)}</span>
              <Link to="/cart" onClick={() => setOpen(false)} className="underline">
                View cart
              </Link>
            </div>
            <Btn variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
              Continue Shopping
            </Btn>
          </footer>
        ) : null}
      </aside>
    </>
  );
}
