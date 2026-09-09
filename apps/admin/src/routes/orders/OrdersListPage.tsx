import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";

type OrderRow = {
  id: string;
  orderNumber: string;
  customer: string;
  total: string;
  status: string;
  date: string;
};
const columns: DataTableColumn<OrderRow>[] = [
  { key: "orderNumber", header: "Order #" },
  { key: "customer", header: "Customer" },
  { key: "total", header: "Total" },
  { key: "status", header: "Status" },
  { key: "date", header: "Date" },
];

export function OrdersListPage() {
  return (
    <AdminLayout title="Orders">
      <DataTable<OrderRow>
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        emptyTitle="No orders yet"
        emptyDescription="Orders will populate once checkout and the orders API are implemented (Phase 7–8)."
      />
    </AdminLayout>
  );
}
