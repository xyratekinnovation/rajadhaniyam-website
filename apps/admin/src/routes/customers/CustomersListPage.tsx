import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import type { Customer } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { ErrorState } from "@/components/states";
import { customersApi } from "@/services/api/customers";

export function CustomersListPage() {
  const navigate = useNavigate();

  const { data: customers, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: customersApi.list,
  });

  const columns: DataTableColumn<Customer>[] = [
    { key: "name", header: "Name", render: (c) => c.name },
    { key: "email", header: "Email", render: (c) => c.email },
    {
      key: "phone",
      header: "Phone",
      render: (c) => c.phone ?? "—",
    },
    {
      key: "orders",
      header: "Orders",
      render: (c) => c.orderCount ?? 0,
    },
    {
      key: "date",
      header: "Joined",
      render: (c) =>
        c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <button
          onClick={() => navigate({ to: "/customers/$customerId", params: { customerId: c.id } })}
          className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-bg)] hover:text-[var(--admin-text)]"
          aria-label={`View customer ${c.name}`}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <AdminLayout title="Customers">
      {isError ? (
        <ErrorState
          title="Couldn't load customers"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable<Customer>
          columns={columns}
          data={customers ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No customers yet"
          emptyDescription="Customer accounts will appear here after registration or checkout signup."
        />
      )}
    </AdminLayout>
  );
}
