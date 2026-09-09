import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Order } from "@rajadhaniyam/shared";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Eyebrow } from "@/components/site/ui";
import { useAuth } from "@/lib/auth";
import { ordersApi } from "@/services/api/orders";
import { inr } from "@/lib/shop-data";
import { ApiError } from "@/services/api/client";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order Details — Rajadhaniyam" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  // Same client-side-only pattern as routes/account.tsx — see its comment.
  const { orderId } = Route.useParams();
  const { customer, isReady } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null | "not-found">(null);

  useEffect(() => {
    if (isReady && !customer) navigate({ to: "/login" });
  }, [isReady, customer, navigate]);

  useEffect(() => {
    if (!customer) return;
    ordersApi
      .getById(orderId)
      .then(setOrder)
      .catch((err) => setOrder(err instanceof ApiError && err.status === 404 ? "not-found" : null));
  }, [customer, orderId]);

  if (!isReady || !customer || order === null) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </SiteLayout>
    );
  }

  if (order === "not-found") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            That order couldn't be found, or doesn't belong to this account.
          </p>
          <Link to="/orders" className="mt-4 inline-block text-sm text-olive underline">
            Back to My Orders
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          to="/orders"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-olive"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Orders
        </Link>
        <Eyebrow className="mt-6">Order #{order.orderNumber}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl capitalize">{order.status}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Placed on{" "}
          {new Date(order.createdAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="mt-8 border border-border">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 border-b border-border p-4 text-sm last:border-0"
            >
              <div>
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="text-muted-foreground">
                  {item.variantWeight} × {item.qty}
                </p>
              </div>
              <span>{inr(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{inr(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping &amp; fees</dt>
            <dd>{inr(order.shipping)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>-{inr(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-3 font-display text-2xl">
            <dt>Total</dt>
            <dd className="text-olive">{inr(order.total)}</dd>
          </div>
        </dl>

        <div className="mt-8 border border-border bg-ivory p-5 text-sm">
          <p className="font-medium text-foreground">Shipping Address</p>
          <p className="mt-2 text-muted-foreground">
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

        <p className="mt-4 text-xs text-muted-foreground">
          Payment: Cash on Delivery ·{" "}
          <span className="capitalize">{order.paymentStatus}</span>
        </p>
      </div>
    </SiteLayout>
  );
}
