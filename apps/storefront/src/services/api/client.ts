import type { ApiResponse } from "@rajadhaniyam/shared";

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

/** Thin fetch wrapper for apps/api. */
// Guarded — this module runs on the server too (SSR loaders), where
// localStorage doesn't exist. Server-rendered requests are always
// unauthenticated; see lib/auth.tsx's comment for why.
function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("customer_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...headers,
    },
    credentials: "include",
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE_URL}${path}`, init);

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
