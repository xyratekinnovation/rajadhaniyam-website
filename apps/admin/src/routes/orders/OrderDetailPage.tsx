import { useParams } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { EmptyState } from "@/components/states/EmptyState";

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false }) as { orderId?: string };

  return (
    <AdminLayout title={`Order ${orderId ?? ""}`}>
      <EmptyState
        title="Order details coming soon"
        description="Line items, payment status, shipping address and status timeline will render here once the orders API exists."
      />
    </AdminLayout>
  );
}
