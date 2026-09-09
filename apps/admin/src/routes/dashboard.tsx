import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, Users, IndianRupee } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { ErrorState } from "@/components/states";
import { analyticsApi } from "@/services/api/analytics";
import type { RecentOrderSummary } from "@rajadhaniyam/shared";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const recentOrdersColumns: DataTableColumn<RecentOrderSummary>[] = [
  { key: "orderNumber", header: "Order #", render: (o) => `#${o.orderNumber}` },
  { key: "customerName", header: "Customer" },
  { key: "total", header: "Total", render: (o) => inr(o.total) },
  { key: "status", header: "Status", className: "capitalize" },
];

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "analytics", "summary"],
    queryFn: analyticsApi.getSummary,
  });

  const statCards = [
    { label: "Revenue (30d)", value: data ? inr(data.revenueLast30Days) : "—", icon: IndianRupee },
    { label: "Orders (30d)", value: data ? String(data.ordersLast30Days) : "—", icon: ShoppingCart },
    { label: "Products", value: data ? String(data.totalProducts) : "—", icon: Package },
    { label: "Customers", value: data ? String(data.totalCustomers) : "—", icon: Users },
  ];

  if (isError) {
    return (
      <AdminLayout title="Dashboard">
        <ErrorState
          title="Couldn't load dashboard data"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
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
        <DataTable<RecentOrderSummary>
          columns={recentOrdersColumns}
          data={data?.recentOrders ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No orders yet"
          emptyDescription="Orders will appear here once customers start checking out."
        />
      </div>
    </AdminLayout>
  );
}
