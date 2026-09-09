import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center">
      <Inbox className="mb-2 h-8 w-8 text-[var(--admin-muted)]" strokeWidth={1.5} />
      <p className="text-sm font-medium text-[var(--admin-text)]">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-[var(--admin-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
