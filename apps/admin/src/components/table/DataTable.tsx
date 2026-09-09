import type { ReactNode } from "react";
import { EmptyState } from "../states/EmptyState";
import { LoadingState } from "../states/LoadingState";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

/**
 * Generic table foundation for admin list pages (Products, Orders,
 * Customers, ...). Pages pass column definitions and data — no
 * page-specific table markup needed.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading,
  emptyTitle = "No records yet",
  emptyDescription,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingState />;
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wide text-[var(--admin-muted)]">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getRowId(row)}
              className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-bg)]"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
