import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import type { Order } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { ErrorState } from "@/components/states";
import { ordersApi } from "@/services/api/orders";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-gray-100 text-gray-600",
};

export function OrdersListPage() {
  const navigate = useNavigate();

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: ordersApi.list,
  });

  const columns: DataTableColumn<Order>[] = [
    { key: "orderNumber", header: "Order #", render: (o) => `#${o.orderNumber}` },
    { key: "customer", header: "Customer", render: (o) => o.shippingAddress.fullName },
    { key: "total", header: "Total", render: (o) => inr(o.total) },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[o.status]}`}
        >
          {o.status}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (o) => new Date(o.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (o) => (
        <button
          onClick={() => navigate({ to: "/orders/$orderId", params: { orderId: o.id } })}
          className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-bg)] hover:text-[var(--admin-text)]"
          aria-label={`View order ${o.orderNumber}`}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <AdminLayout title="Orders">
      {isError ? (
        <ErrorState
          title="Couldn't load orders"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable<Order>
          columns={columns}
          data={orders ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No orders yet"
          emptyDescription="Orders will appear here once customers start checking out."
        />
      )}
    </AdminLayout>
  );
}
