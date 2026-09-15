import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_SHIPPING_SETTINGS, type ShippingSettings } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { FormField } from "@/components/form/FormField";
import { LoadingState, ErrorState } from "@/components/states";
import { settingsApi } from "@/services/api/settings";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [savedMessage, setSavedMessage] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "settings", "shipping"],
    queryFn: settingsApi.getShipping,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (input: ShippingSettings) => settingsApi.setShipping(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "settings", "shipping"], updated);
      setForm(updated);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  if (isLoading) {
    return (
      <AdminLayout title="Settings">
        <LoadingState label="Loading settings..." />
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout title="Settings">
        <ErrorState
          title="Couldn't load settings"
          description={error instanceof Error ? error.message : "Please try again."}
          onRetry={() => refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
      >
        <div>
          <h2 className="text-sm font-medium text-[var(--admin-text)]">Shipping charges</h2>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            Controls cart totals, checkout amounts, and free-shipping rules across the storefront.
          </p>
        </div>

        <FormField
          label="Standard shipping fee (₹)"
          htmlFor="standardShippingFee"
          type="number"
          min={0}
          step="1"
          required
          value={form.standardShippingFee}
          onChange={(e) =>
            setForm((f) => ({ ...f, standardShippingFee: Number(e.target.value) || 0 }))
          }
          hint="Charged when the order is below the free-shipping threshold."
        />

        <FormField
          label="Free shipping threshold (₹)"
          htmlFor="freeShippingThreshold"
          type="number"
          min={0}
          step="1"
          required
          value={form.freeShippingThreshold}
          onChange={(e) =>
            setForm((f) => ({ ...f, freeShippingThreshold: Number(e.target.value) || 0 }))
          }
          hint="Orders at or above this subtotal get free base shipping."
        />

        <FormField
          label="Cash on Delivery surcharge (₹)"
          htmlFor="codSurcharge"
          type="number"
          min={0}
          step="1"
          required
          value={form.codSurcharge}
          onChange={(e) => setForm((f) => ({ ...f, codSurcharge: Number(e.target.value) || 0 }))}
          hint="Added only when the customer chooses Cash on Delivery."
        />

        <FormField
          label="Shipping-waived product name"
          htmlFor="shippingWaivedProductName"
          value={form.shippingWaivedProductName}
          onChange={(e) => setForm((f) => ({ ...f, shippingWaivedProductName: e.target.value }))}
          hint='If the cart contains only this product (e.g. "test"), base shipping is ₹0. Leave blank to disable.'
        />

        {saveMutation.isError ? (
          <p className="text-xs text-red-600">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Couldn't save shipping settings"}
          </p>
        ) : null}
        {savedMessage ? (
          <p className="text-xs text-green-700">Shipping settings saved.</p>
        ) : null}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="h-10 rounded-md bg-[var(--admin-primary)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : "Save shipping settings"}
        </button>
      </form>
    </AdminLayout>
  );
}
