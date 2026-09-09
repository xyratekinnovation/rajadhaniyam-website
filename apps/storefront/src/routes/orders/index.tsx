import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Order } from "@rajadhaniyam/shared";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Eyebrow } from "@/components/site/ui";
import { useAuth } from "@/lib/auth";
import { ordersApi } from "@/services/api/orders";
import { inr } from "@/lib/shop-data";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "My Orders — Rajadhaniyam" }] }),
  component: OrdersPage,
});

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-gray-100 text-gray-600",
};

function OrdersPage() {
  // Same client-side-only pattern as routes/account.tsx — see its comment.
  const { customer, isReady } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (isReady && !customer) navigate({ to: "/login" });
  }, [isReady, customer, navigate]);

  useEffect(() => {
    if (!customer) return;
    ordersApi
      .list()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [customer]);

  if (!isReady || !customer) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Eyebrow>My Orders</Eyebrow>
        <h1 className="mt-3 font-display text-4xl">Order History</h1>

        <div className="mt-8 space-y-4">
          {orders === null ? (
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't placed any orders yet.{" "}
              <Link to="/shop" className="text-olive underline">
                Start shopping
              </Link>
              .
            </p>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                to="/orders/$orderId"
                params={{ orderId: order.id }}
                className="flex items-center justify-between gap-4 border border-border p-5 text-sm hover:border-olive"
              >
                <div>
                  <p className="font-medium text-foreground">#{order.orderNumber}</p>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <span className="font-display text-lg text-olive">{inr(order.total)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
