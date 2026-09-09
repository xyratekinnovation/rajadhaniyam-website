import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Customer } from "@rajadhaniyam/shared";
import { authApi } from "@/services/api/auth";

const TOKEN_KEY = "customer_token";
const CUSTOMER_KEY = "customer";

// This app is SSR (TanStack Start) but auth state lives in localStorage,
// which doesn't exist on the server — so the server (and the client's first
// render, to match it and avoid a hydration mismatch) always renders
// "logged out", and a useEffect corrects it once mounted in the browser.
// Practical consequence: any route that needs to know "is this customer
// logged in" server-side (an SSR loader) can't — account/address data is
// fetched client-side after mount instead (see routes/account.tsx).
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredCustomer(): Customer | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CUSTOMER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Customer;
  } catch {
    return null;
  }
}

type AuthCtx = {
  customer: Customer | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setCustomer(getStoredCustomer());
    setIsReady(true);
  }, []);

  const persist = useCallback((token: string, nextCustomer: Customer) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(nextCustomer));
    setCustomer(nextCustomer);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, customer: c } = await authApi.login(email, password);
      persist(token, c);
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { token, customer: c } = await authApi.register(name, email, password);
      persist(token, c);
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
    setCustomer(null);
    authApi.logout().catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ customer, isReady, login, register, logout }),
    [customer, isReady, login, register, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
