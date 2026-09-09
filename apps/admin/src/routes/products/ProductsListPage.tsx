import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: string;
};
const columns: DataTableColumn<ProductRow>[] = [
  { key: "name", header: "Name" },
  { key: "category", header: "Category" },
  { key: "price", header: "Price" },
  { key: "stock", header: "Stock" },
  { key: "status", header: "Status" },
];

export function ProductsListPage() {
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
      <DataTable<ProductRow>
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        emptyTitle="No products yet"
        emptyDescription="Products created here will replace the storefront's mock catalog once apps/api's products module is implemented."
      />
    </AdminLayout>
  );
}
