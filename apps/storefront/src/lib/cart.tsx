import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SHIPPING_SETTINGS,
  isShippingWaivedForProducts,
  type ShippingSettings,
} from "@rajadhaniyam/shared";
import type { Product } from "./shop-data";
import { useAuth } from "./auth";
import { cartApi } from "@/services/api/cart";
import { settingsApi } from "@/services/api/settings";

export type CartLine = {
  id: string;
  productId: string;
  name: string;
  image: string;
  weight: string;
  price: number;
  qty: number;
};

type CartCtx = {
  lines: CartLine[];
  add: (product: Product, weight?: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
  shippingSettings: ShippingSettings;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

/**
 * Phase 6: local state stays the source of truth for instant UI feedback
 * (every mutation updates it optimistically first), backed by a best-effort
 * server sync — every call below also fires the matching apps/api request
 * and reconciles `lines` with its response once it lands. Failures are
 * swallowed on purpose: a flaky network shouldn't block adding to cart, and
 * the next successful call (or the next mount/login/logout, which
 * re-hydrates from the server) corrects any drift.
 *
 * Known gap: `setQty`/`remove` send whatever `id` is currently in state. If
 * called on a line added moments ago whose `add()` server round-trip hasn't
 * resolved yet, that `id` is still the local optimistic key, not the real
 * server item id — the call 404s server-side (swallowed) rather than
 * applying, though local state still updates instantly. In practice this
 * only matters for very rapid double-actions on a brand new line; not
 * worth a request-queue for this phase.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(
    DEFAULT_SHIPPING_SETTINGS,
  );
  const { customer, isReady } = useAuth();

  useEffect(() => {
    settingsApi
      .getShipping()
      .then(setShippingSettings)
      .catch(() => {});
  }, []);

  // Hydrate from the server on mount and whenever identity changes (login
  // merges the guest cart server-side — see auth.service.ts — so re-fetching
  // here picks up the merged result; logout switches back to whatever the
  // browser's permanent guest session id owns).
  useEffect(() => {
    if (!isReady) return;
    cartApi
      .get()
      .then((cart) => setLines(cart.items))
      .catch(() => {});
  }, [isReady, customer?.id]);

  const add = useCallback((product: Product, weight?: string, qty = 1) => {
    const w = weight ?? product.weight;
    const id = `${product.id}__${w}`;
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l));
      return [
        ...prev,
        {
          id,
          productId: product.id,
          name: product.name,
          image: product.image,
          weight: w,
          price: product.price,
          qty,
        },
      ];
    });
    setOpen(true);
    cartApi
      .addItem(product.id, w, qty)
      .then((cart) => setLines(cart.items))
      .catch(() => {});
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
    cartApi
      .updateItem(id, qty)
      .then((cart) => setLines(cart.items))
      .catch(() => {});
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    cartApi.removeItem(id).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    cartApi.clear().catch(() => {});
  }, []);

  const value = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping =
      subtotal === 0 ||
      subtotal >= shippingSettings.freeShippingThreshold ||
      isShippingWaivedForProducts(
        lines.map((l) => l.name),
        shippingSettings.shippingWaivedProductName,
      )
        ? 0
        : shippingSettings.standardShippingFee;
    return {
      lines,
      add,
      setQty,
      remove,
      clear,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      freeShippingThreshold: shippingSettings.freeShippingThreshold,
      shippingSettings,
      open,
      setOpen,
    };
  }, [lines, add, setQty, remove, clear, open, shippingSettings]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
