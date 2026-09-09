import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Address } from "@rajadhaniyam/shared";
import { Plus, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Btn, Eyebrow } from "@/components/site/ui";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/services/api/auth";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Rajadhaniyam" }] }),
  component: AccountPage,
});

const field =
  "h-10 w-full border border-input bg-paper px-3 text-sm outline-none focus:border-olive";

const emptyAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

function AccountPage() {
  // No SSR loader here on purpose — auth state only exists in the browser
  // (see lib/auth.tsx), so this page's data loads client-side after mount.
  const { customer, isReady, logout } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !customer) {
      navigate({ to: "/login" });
    }
  }, [isReady, customer, navigate]);

  useEffect(() => {
    if (!customer) return;
    authApi.listAddresses().then(setAddresses).catch(() => setAddresses([]));
  }, [customer]);

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await authApi.createAddress(form);
      setAddresses((prev) => [...(prev ?? []), created]);
      setForm(emptyAddress);
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add address");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    await authApi.removeAddress(id);
    setAddresses((prev) => (prev ?? []).filter((a) => a.id !== id));
  }

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
        <Eyebrow>My Account</Eyebrow>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="font-display text-4xl">Hi, {customer.name}</h1>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="text-sm text-muted-foreground underline hover:text-olive"
          >
            Sign out
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{customer.email}</p>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-2xl">Saved Addresses</h2>
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-olive hover:underline"
            >
              <Plus className="h-4 w-4" /> Add Address
            </button>
          ) : null}
        </div>

        {isAdding ? (
          <form onSubmit={handleAddAddress} className="mt-4 space-y-3 border border-border p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className={field}
              />
              <input
                required
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={field}
              />
            </div>
            <input
              required
              placeholder="Address line 1"
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              className={field}
            />
            <input
              placeholder="Address line 2 (optional)"
              value={form.line2}
              onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              className={field}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                required
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className={field}
              />
              <input
                required
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className={field}
              />
              <input
                required
                placeholder="Postal code"
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                className={field}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              Set as default address
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-3">
              <Btn type="submit">Save Address</Btn>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-sm text-muted-foreground underline"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-4 space-y-3">
          {addresses === null ? (
            <p className="text-sm text-muted-foreground">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
          ) : (
            addresses.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-4 border border-border p-4 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {a.fullName}{" "}
                    {a.isDefault ? (
                      <span className="ml-2 bg-olive px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-paper">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}
                  </p>
                  <p className="text-muted-foreground">{a.phone}</p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  aria-label="Delete address"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
