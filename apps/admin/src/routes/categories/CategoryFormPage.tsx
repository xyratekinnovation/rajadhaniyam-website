import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryInputSchema, type CategoryInput } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { FormField } from "@/components/form/FormField";
import { LoadingState } from "@/components/states";
import { categoriesApi } from "@/services/api/categories";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryFormPage() {
  const params = useParams({ strict: false }) as { categoryId?: string };
  const isEdit = Boolean(params.categoryId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: existing, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["admin", "category", params.categoryId],
    queryFn: () => categoriesApi.getById(params.categoryId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setSlug(existing.slug);
    setSlugTouched(true);
    setDescription(existing.description);
    setImage(existing.image);
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      isEdit ? categoriesApi.update(params.categoryId!, input) : categoriesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      navigate({ to: "/categories" });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save category");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = categoryInputSchema.safeParse({ name, slug, description, image });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    saveMutation.mutate(parsed.data);
  }

  if (isEdit && isLoadingExisting) {
    return (
      <AdminLayout title="Edit Category">
        <LoadingState label="Loading category..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? `Edit Category — ${name}` : "Add Category"}>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Category Name"
            htmlFor="name"
            placeholder="Millet Grains"
            required
            value={name}
            onChange={(e) => {
              const value = e.target.value;
              setName(value);
              if (!slugTouched) setSlug(slugify(value));
            }}
          />
          <FormField
            label="Slug"
            htmlFor="slug"
            placeholder="millet-grains"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
          />
        </div>
        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
            placeholder="Short category description..."
          />
        </FormField>
        <FormField
          label="Image URL"
          htmlFor="image"
          hint="Paste a hosted URL, or a /public path like /assets/cat-grains.jpg"
          placeholder="/assets/cat-grains.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="h-10 rounded-md bg-[var(--admin-primary)] px-6 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90 disabled:opacity-60"
        >
          {saveMutation.isPending ? "Saving..." : "Save Category"}
        </button>
      </form>
    </AdminLayout>
  );
}
