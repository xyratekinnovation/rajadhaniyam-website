import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoadingState, ErrorState } from "@/components/states";
import { ordersApi } from "@/services/api/orders";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const STATUSES: Order["status"][] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => ordersApi.getById(orderId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: Order["status"]) => ordersApi.updateStatus(orderId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "order", orderId], updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout title="Order">
        <LoadingState label="Loading order..." />
      </AdminLayout>
    );
  }

  if (isError || !order) {
    return (
      <AdminLayout title="Order">
        <ErrorState
          title="Couldn't load this order"
          description="It may not exist, or apps/api is unreachable."
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Order #${order.orderNumber}`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wide text-[var(--admin-muted)]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Weight</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--admin-border)] last:border-0">
                    <td className="px-4 py-3">{item.productName}</td>
                    <td className="px-4 py-3">{item.variantWeight}</td>
                    <td className="px-4 py-3">{item.qty}</td>
                    <td className="px-4 py-3 text-right">{inr(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
            <h3 className="text-sm font-medium text-[var(--admin-text)]">Shipping Address</h3>
            <p className="mt-2 text-sm text-[var(--admin-muted)]">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.phone}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
            <h3 className="text-sm font-medium text-[var(--admin-text)]">Status</h3>
            <select
              value={order.status}
              onChange={(e) => statusMutation.mutate(e.target.value as Order["status"])}
              disabled={statusMutation.isPending}
              className="mt-3 h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm capitalize outline-none focus:border-[var(--admin-primary)] disabled:opacity-60"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs text-[var(--admin-muted)]">
              Payment: Cash on Delivery ·{" "}
              <span className="capitalize">{order.paymentStatus}</span>
            </p>
          </div>

          <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 text-sm">
            <h3 className="font-medium text-[var(--admin-text)]">Summary</h3>
            <dl className="mt-3 space-y-2 text-[var(--admin-muted)]">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{inr(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping &amp; fees</dt>
                <dd>{inr(order.shipping)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between">
                  <dt>Discount</dt>
                  <dd>-{inr(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[var(--admin-border)] pt-2 font-medium text-[var(--admin-text)]">
                <dt>Total</dt>
                <dd>{inr(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
