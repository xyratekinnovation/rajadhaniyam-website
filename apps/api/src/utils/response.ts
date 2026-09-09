import type { ZodError } from "zod";
import type { ApiResponse, PaginatedResponse } from "@rajadhaniyam/shared";

export const ok = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const paginated = <T>(
  data: T[],
  pagination: { page?: number; pageSize?: number; total?: number } = {},
): PaginatedResponse<T> => {
  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 20;
  const total = pagination.total ?? data.length;
  return {
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
};

export const formatZodError = (error: ZodError): string => {
  const issue = error.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
};

export const notImplemented = (feature: string) => ({
  success: false,
  message: `${feature} is not implemented yet — see docs/DEVELOPMENT_ROADMAP.md`,
});
