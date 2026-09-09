import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { ErrorState } from "@/components/states";
import { productsApi } from "@/services/api/products";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function ProductsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: productsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => productsApi.remove(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "Name" },
    { key: "category", header: "Category" },
    {
      key: "price",
      header: "Price",
      render: (p) => `${inr(p.price)} (${p.weight})`,
    },
    {
      key: "stock",
      header: "Variants",
      render: (p) => `${p.weights.length} weight${p.weights.length === 1 ? "" : "s"}`,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            p.status === "active"
              ? "bg-green-100 text-green-700"
              : p.status === "draft"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate({ to: "/products/$productId", params: { productId: p.id } })}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-bg)] hover:text-[var(--admin-text)]"
            aria-label={`Edit ${p.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                deleteMutation.mutate(p.id);
              }
            }}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${p.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Products">
      <div className="flex justify-end">
        <Link
          to="/products/new"
          className="flex items-center gap-1.5 rounded-md bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>
      {isError ? (
        <ErrorState
          title="Couldn't load products"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable<Product>
          columns={columns}
          data={products ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No products yet"
          emptyDescription="Add your first product to see it appear here and on the storefront."
        />
      )}
    </AdminLayout>
  );
}
