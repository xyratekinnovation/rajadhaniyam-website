import type { ReactNode } from "react";
import { AdminLayout } from "./layout/AdminLayout";
import { EmptyState } from "./states/EmptyState";

type PagePlaceholderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

/**
 * Shared shell for admin pages that only have a foundation layout so far.
 * Swap the <EmptyState> body for a real DataTable/form once that module's
 * backend endpoints exist (see docs/DEVELOPMENT_ROADMAP.md).
 */
export function PagePlaceholder({ title, description, action }: PagePlaceholderProps) {
  return (
    <AdminLayout title={title}>
      <EmptyState title={`${title} coming soon`} description={description} action={action} />
    </AdminLayout>
  );
}
