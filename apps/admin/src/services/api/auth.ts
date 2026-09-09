import { ApiError } from "./client";
import type { StoredAdmin } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

// Not routed through client.ts's request() — that helper prefixes every path
// with /admin (apps/api's protected admin resource routes), but login lives
// at /auth/admin/login and, being how a session is first obtained, can't
// require one to already exist.
export async function adminLogin(
  email: string,
  password: string,
): Promise<{ token: string; admin: StoredAdmin }> {
  const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(payload.message ?? "Login failed", response.status);
  }
  return payload.data;
}
