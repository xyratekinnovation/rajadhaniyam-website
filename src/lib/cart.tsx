import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./shop-data";

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
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export const FREE_SHIPPING_THRESHOLD = 499;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

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
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49;
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
      open,
      setOpen,
    };
  }, [lines, add, setQty, remove, clear, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
