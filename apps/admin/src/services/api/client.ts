import type { ApiResponse } from "@rajadhaniyam/shared";
import { getToken, clearSession } from "@/lib/auth";

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

// A 401 here means the stored token is missing/expired/invalid — there's no
// refresh-token flow (Phase 5 scope was login + real verification, not
// silent renewal), so the only correct move is to drop the session and send
// the admin back to log in again.
function handleUnauthorized() {
  clearSession();
  if (location.pathname !== "/login") location.href = "/login";
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...headers,
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) handleUnauthorized();
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

// Separate from request() — a multipart body must NOT have a manually-set
// Content-Type (the browser needs to add its own boundary parameter), and
// must not be JSON.stringify'd.
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    method: "POST",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    credentials: "include",
    body: formData,
  });

  if (response.status === 401) handleUnauthorized();
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with ${response.status}`, response.status);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}
