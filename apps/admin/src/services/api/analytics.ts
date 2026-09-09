import type { AnalyticsSummary } from "@rajadhaniyam/shared";
import { apiGet } from "./client";

export const analyticsApi = {
  getSummary: () => apiGet<AnalyticsSummary>("/analytics/summary"),
};
