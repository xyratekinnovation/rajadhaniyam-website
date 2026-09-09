import { Package, ShoppingCart, Users, IndianRupee } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";

const STAT_CARDS = [
  { label: "Revenue (30d)", value: "—", icon: IndianRupee },
  { label: "Orders (30d)", value: "—", icon: ShoppingCart },
  { label: "Products", value: "—", icon: Package },
  { label: "Customers", value: "—", icon: Users },
] as const;

type RecentOrderRow = {
  id: string;
  orderNumber: string;
  customer: string;
  total: string;
  status: string;
};
const recentOrdersColumns: DataTableColumn<RecentOrderRow>[] = [
  { key: "orderNumber", header: "Order #" },
  { key: "customer", header: "Customer" },
  { key: "total", header: "Total" },
  { key: "status", header: "Status" },
];

export function DashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
          >
            <div>
              <p className="text-xs text-[var(--admin-muted)]">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">{value}</p>
            </div>
            <Icon className="h-8 w-8 text-[var(--admin-primary)]" strokeWidth={1.5} />
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">Recent Orders</h2>
        <DataTable<RecentOrderRow>
          columns={recentOrdersColumns}
          data={[]}
          getRowId={(row) => row.id}
          emptyTitle="No orders yet"
          emptyDescription="Orders will appear here once the orders API is connected."
        />
      </div>
    </AdminLayout>
  );
}
