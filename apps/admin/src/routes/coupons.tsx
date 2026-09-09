import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Coupon, CouponInput } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { FormField } from "@/components/form/FormField";
import { ErrorState } from "@/components/states";
import { couponsApi } from "@/services/api/coupons";
import { ApiError } from "@/services/api/client";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type FormState = {
  code: string;
  description: string;
  type: "percentage" | "flat";
  value: string;
  minOrderValue: string;
  active: boolean;
  expiresAt: string;
};

const emptyForm: FormState = {
  code: "",
  description: "",
  type: "percentage",
  value: "",
  minOrderValue: "",
  active: true,
  expiresAt: "",
};

export function CouponsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: coupons, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: couponsApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: (input: CouponInput) =>
      editing ? couponsApi.update(editing.id, input) : couponsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setIsAdding(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
    onError: (err: unknown) => {
      alert(
        err instanceof ApiError && err.status === 409
          ? "Can't delete — this coupon has already been used on an order."
          : "Failed to delete coupon.",
      );
    },
  });

  function startEdit(coupon: Coupon) {
    setEditing(coupon);
    setIsAdding(true);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      type: coupon.type,
      value: String(coupon.value),
      minOrderValue: coupon.minOrderValue !== undefined ? String(coupon.minOrderValue) : "",
      active: coupon.active,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    saveMutation.mutate({
      code: form.code,
      description: form.description || undefined,
      type: form.type,
      value: Number(form.value),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
      active: form.active,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    });
  }

  const columns: DataTableColumn<Coupon>[] = [
    { key: "code", header: "Code" },
    {
      key: "value",
      header: "Discount",
      render: (c) => (c.type === "percentage" ? `${c.value}%` : inr(c.value)),
    },
    {
      key: "minOrderValue",
      header: "Min. Order",
      render: (c) => (c.minOrderValue ? inr(c.minOrderValue) : "—"),
    },
    {
      key: "active",
      header: "Status",
      render: (c) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {c.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Expires",
      render: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => startEdit(c)}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-bg)] hover:text-[var(--admin-text)]"
            aria-label={`Edit ${c.code}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete coupon "${c.code}"?`)) deleteMutation.mutate(c.id);
            }}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${c.code}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Coupons">
      <div className="flex justify-end">
        {!isAdding ? (
          <button
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setIsAdding(true);
            }}
            className="flex items-center gap-1.5 rounded-md bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add Coupon
          </button>
        ) : null}
      </div>

      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl space-y-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Code"
              htmlFor="code"
              placeholder="WELCOME10"
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
            <FormField label="Type" htmlFor="type">
              <select
                id="type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as FormState["type"] }))
                }
                className="h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]"
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat amount</option>
              </select>
            </FormField>
            <FormField
              label={form.type === "percentage" ? "Discount %" : "Discount ₹"}
              htmlFor="value"
              type="number"
              required
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
            <FormField
              label="Min. Order Value (optional)"
              htmlFor="minOrderValue"
              type="number"
              value={form.minOrderValue}
              onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
            />
            <FormField
              label="Expires On (optional)"
              htmlFor="expiresAt"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>
          <FormField label="Description (optional)" htmlFor="description">
            <textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="h-10 rounded-md bg-[var(--admin-primary)] px-6 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90 disabled:opacity-60"
            >
              {saveMutation.isPending ? "Saving..." : "Save Coupon"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditing(null);
                setError(null);
              }}
              className="text-sm text-[var(--admin-muted)] underline"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isError ? (
        <ErrorState
          title="Couldn't load coupons"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable<Coupon>
          columns={columns}
          data={coupons ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No coupons yet"
          emptyDescription="Add a coupon to offer discounts at checkout."
        />
      )}
    </AdminLayout>
  );
}
