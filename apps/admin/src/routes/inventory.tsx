import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { ErrorState } from "@/components/states";
import { inventoryApi } from "@/services/api/inventory";

function StockCell({ item }: { item: InventoryItem }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(item.stock));

  const mutation = useMutation({
    mutationFn: (stock: number) => inventoryApi.setStock(item.variantId, stock),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] }),
  });

  function commit() {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed === item.stock) {
      setValue(String(item.stock));
      return;
    }
    mutation.mutate(parsed);
  }

  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      disabled={mutation.isPending}
      className="h-8 w-20 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-sm outline-none focus:border-[var(--admin-primary)] disabled:opacity-60"
    />
  );
}

export function InventoryPage() {
  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: inventoryApi.list,
  });

  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "productName", header: "Product" },
    { key: "weight", header: "Weight" },
    { key: "sku", header: "SKU" },
    {
      key: "stock",
      header: "Stock",
      render: (item) => <StockCell item={item} />,
    },
    {
      key: "status",
      header: "",
      render: (item) =>
        item.lowStock ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Low stock
          </span>
        ) : null,
    },
  ];

  return (
    <AdminLayout title="Inventory">
      {isError ? (
        <ErrorState
          title="Couldn't load inventory"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable<InventoryItem>
          columns={columns}
          data={items ?? []}
          getRowId={(row) => row.variantId}
          isLoading={isLoading}
          emptyTitle="No product variants yet"
          emptyDescription="Add products with weights/pricing to see their stock here."
        />
      )}
    </AdminLayout>
  );
}
