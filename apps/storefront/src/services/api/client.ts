import type { ApiResponse } from "@rajadhaniyam/shared";
import { getGuestSessionId } from "@/lib/cartSession";

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

// Both guarded — this module runs on the server too (SSR loaders), where
// localStorage doesn't exist. Server-rendered requests are always
// unauthenticated and cart-session-less; see lib/auth.tsx's comment for why.
function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("customer_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Sent on every request, not just /cart ones — harmless elsewhere, and
// simpler than threading it through only the cart API calls.
function cartSessionHeader(): Record<string, string> {
  const id = getGuestSessionId();
  return id ? { "X-Cart-Session": id } : {};
}

/** Thin fetch wrapper for apps/api. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...cartSessionHeader(),
      ...headers,
    },
    credentials: "include",
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE_URL}${path}`, init);

  // A 401 on an authenticated call means the stored token is stale (expired,
  // or the account behind it no longer exists — see the matching comment in
  // apps/api/src/middleware/auth.ts). Clearing it here means the next
  // request/page load correctly treats the visitor as logged out (and, for
  // guest-friendly routes like /cart, retries as a guest via the session
  // header, which is always sent) instead of repeating the same 401 forever.
  if (response.status === 401 && typeof window !== "undefined" && authHeader()["Authorization"]) {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer");
  }

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with ${response.status}`, response.status);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export const apiGet = <T>(path: string) => request<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body });
export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body });
export const apiDelete = <T>(path: string) => request<T>(path, { method: "DELETE" });
