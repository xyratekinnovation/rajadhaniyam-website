import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LoadingState, ErrorState } from "@/components/states";
import { customersApi } from "@/services/api/customers";

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

export function CustomerDetailPage() {
  const { customerId } = useParams({ strict: false }) as { customerId: string };

  const customerQuery = useQuery({
    queryKey: ["admin", "customer", customerId],
    queryFn: () => customersApi.getById(customerId),
  });

  const addressesQuery = useQuery({
    queryKey: ["admin", "customer", customerId, "addresses"],
    queryFn: () => customersApi.listAddresses(customerId),
  });

  const ordersQuery = useQuery({
    queryKey: ["admin", "customer", customerId, "orders"],
    queryFn: () => customersApi.listOrders(customerId),
  });

  if (customerQuery.isLoading) {
    return (
      <AdminLayout title="Customer">
        <LoadingState label="Loading customer..." />
      </AdminLayout>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <AdminLayout title="Customer">
        <ErrorState
          title="Couldn't load this customer"
          description="They may not exist, or apps/api is unreachable."
          onRetry={() => customerQuery.refetch()}
        />
      </AdminLayout>
    );
  }

  const customer = customerQuery.data;

  return (
    <AdminLayout title={customer.name}>
      <div className="mb-4">
        <Link
          to="/customers"
          className="text-sm text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        >
          ← Back to customers
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
            <h2 className="text-sm font-medium text-[var(--admin-muted)]">Profile</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--admin-muted)]">Email</dt>
                <dd>{customer.email}</dd>
              </div>
              <div>
                <dt className="text-[var(--admin-muted)]">Phone</dt>
                <dd>{customer.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--admin-muted)]">Joined</dt>
                <dd>
                  {customer.createdAt
                    ? new Date(customer.createdAt).toLocaleString("en-IN")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--admin-muted)]">Orders</dt>
                <dd>{customer.orderCount ?? ordersQuery.data?.length ?? 0}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
            <div className="border-b border-[var(--admin-border)] px-4 py-3 text-sm font-medium">
              Addresses
            </div>
            {addressesQuery.isError ? (
              <p className="px-4 py-6 text-sm text-[var(--admin-muted)]">Couldn't load addresses.</p>
            ) : addressesQuery.isLoading ? (
              <p className="px-4 py-6 text-sm text-[var(--admin-muted)]">Loading addresses…</p>
            ) : (addressesQuery.data?.length ?? 0) === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--admin-muted)]">No saved addresses.</p>
            ) : (
              <ul className="divide-y divide-[var(--admin-border)]">
                {addressesQuery.data!.map((a) => (
                  <li key={a.id} className="px-4 py-3 text-sm">
                    <p className="font-medium">
                      {a.fullName}
                      {a.isDefault ? (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[var(--admin-muted)]">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                      <br />
                      {a.city}, {a.state} {a.postalCode}
                      <br />
                      {a.phone}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
            <div className="border-b border-[var(--admin-border)] px-4 py-3 text-sm font-medium">
              Orders
            </div>
            {ordersQuery.isError ? (
              <p className="px-4 py-6 text-sm text-[var(--admin-muted)]">Couldn't load orders.</p>
            ) : ordersQuery.isLoading ? (
              <p className="px-4 py-6 text-sm text-[var(--admin-muted)]">Loading orders…</p>
            ) : (ordersQuery.data?.length ?? 0) === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--admin-muted)]">No orders yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wide text-[var(--admin-muted)]">
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersQuery.data!.map((o) => (
                    <tr key={o.id} className="border-b border-[var(--admin-border)] last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to="/orders/$orderId"
                          params={{ orderId: o.id }}
                          className="text-[var(--admin-primary)] hover:underline"
                        >
                          #{o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{inr(o.total)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[o.status]}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
