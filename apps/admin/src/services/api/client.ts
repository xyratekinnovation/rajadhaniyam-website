import type { ApiResponse } from "@rajadhaniyam/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      // PHASE 5 TODO: requireAdminAuth (apps/api/src/middleware/auth.ts) is
      // still foundation-only — it just checks a header is present, not that
      // it's a real, verified admin session. This placeholder satisfies that
      // check so Phase 4's admin CRUD is testable end-to-end today. It is
      // NOT real security — anyone can call these endpoints. Must be replaced
      // with a real login-issued token before any production deploy.
      Authorization: "Bearer dev-placeholder-token",
      ...headers,
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
