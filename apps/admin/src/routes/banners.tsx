import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Banner, BannerInput } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { FormField } from "@/components/form/FormField";
import { ImageUploadButton } from "@/components/form/ImageUploadButton";
import { ErrorState } from "@/components/states";
import { bannersApi } from "@/services/api/content";

type FormState = {
  title: string;
  image: string;
  link: string;
  position: string;
  active: boolean;
};

const emptyForm: FormState = { title: "", image: "", link: "", position: "0", active: true };

export function BannersPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: banners, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: bannersApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: (input: BannerInput) =>
      editing ? bannersApi.update(editing.id, input) : bannersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      setIsAdding(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });

  function startEdit(banner: Banner) {
    setEditing(banner);
    setIsAdding(true);
    setForm({
      title: banner.title,
      image: banner.image,
      link: banner.link ?? "",
      position: String(banner.position),
      active: banner.active,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    saveMutation.mutate({
      title: form.title,
      image: form.image,
      link: form.link || undefined,
      position: Number(form.position) || 0,
      active: form.active,
    });
  }

  const columns: DataTableColumn<Banner>[] = [
    {
      key: "image",
      header: "",
      render: (b) => (
        <img src={b.image} alt="" className="h-10 w-16 rounded object-cover" />
      ),
    },
    { key: "title", header: "Title" },
    { key: "position", header: "Position" },
    {
      key: "active",
      header: "Status",
      render: (b) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {b.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (b) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => startEdit(b)}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-bg)] hover:text-[var(--admin-text)]"
            aria-label={`Edit ${b.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete banner "${b.title}"?`)) deleteMutation.mutate(b.id);
            }}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${b.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Banners">
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
            <Plus className="h-4 w-4" /> Add Banner
          </button>
        ) : null}
      </div>

      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          className="max-w-xl space-y-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
        >
          <FormField
            label="Title"
            htmlFor="title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <FormField label="Image" htmlFor="image">
            <div className="space-y-1.5">
              {form.image ? (
                <img
                  src={form.image}
                  alt=""
                  className="h-16 w-28 rounded-md border border-[var(--admin-border)] object-cover"
                />
              ) : null}
              <div className="flex gap-2">
                <input
                  id="image"
                  required
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  className="h-10 flex-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <ImageUploadButton onUploaded={(url) => setForm((f) => ({ ...f, image: url }))} />
              </div>
            </div>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Link (optional)"
              htmlFor="link"
              placeholder="/shop"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            />
            <FormField
              label="Position"
              htmlFor="position"
              type="number"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            />
          </div>
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
              {saveMutation.isPending ? "Saving..." : "Save Banner"}
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
          title="Couldn't load banners"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable<Banner>
          columns={columns}
          data={banners ?? []}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No banners yet"
          emptyDescription="Add a banner to show a promo strip on the homepage."
        />
      )}
    </AdminLayout>
  );
}
