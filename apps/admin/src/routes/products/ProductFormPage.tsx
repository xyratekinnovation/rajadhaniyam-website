import { useParams } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { FormField } from "@/components/form/FormField";

export function ProductFormPage() {
  const params = useParams({ strict: false }) as { productId?: string };
  const isEdit = Boolean(params.productId);

  return (
    <AdminLayout
      title={
        isEdit ? `Edit Product${params.productId ? ` — ${params.productId}` : ""}` : "Add Product"
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: POST/PATCH /products once apps/api's products module ships (Phase 3)
        }}
        className="max-w-2xl space-y-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Product Name" htmlFor="name" placeholder="Kambu Broken" required />
          <FormField label="Slug" htmlFor="slug" placeholder="kambu-broken" required />
          <FormField label="Category" htmlFor="category" placeholder="Millet Grains" required />
          <FormField label="Status" htmlFor="status" hint="draft, active or archived">
            <select
              id="status"
              className="h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </FormField>
          <FormField label="Price (₹)" htmlFor="price" type="number" placeholder="95" required />
          <FormField label="MRP (₹)" htmlFor="mrp" type="number" placeholder="120" required />
          <FormField label="Weight" htmlFor="weight" placeholder="500 g" required />
          <FormField label="Stock" htmlFor="stock" type="number" placeholder="0" required />
        </div>
        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={4}
            className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
            placeholder="Short product description..."
          />
        </FormField>
        <button
          type="submit"
          className="h-10 rounded-md bg-[var(--admin-primary)] px-6 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90"
        >
          Save Product
        </button>
      </form>
    </AdminLayout>
  );
}
