import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { productInputSchema, type ProductInput, type ProductVariantInput } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { FormField } from "@/components/form/FormField";
import { ImageUploadButton } from "@/components/form/ImageUploadButton";
import { LoadingState } from "@/components/states";
import { productsApi } from "@/services/api/products";
import { categoriesApi } from "@/services/api/categories";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const emptyVariant: ProductVariantInput = { weight: "", price: 0, mrp: 0, stock: 0 };

type FormState = {
  name: string;
  slug: string;
  slugTouched: boolean;
  categoryId: string;
  status: "draft" | "active" | "archived";
  bestseller: boolean;
  featured: boolean;
  description: string;
  ingredients: string;
  images: string[];
  variants: ProductVariantInput[];
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  slugTouched: false,
  categoryId: "",
  status: "draft",
  bestseller: false,
  featured: false,
  description: "",
  ingredients: "",
  images: [""],
  variants: [{ ...emptyVariant }],
};

export function ProductFormPage() {
  const params = useParams({ strict: false }) as { productId?: string };
  const isEdit = Boolean(params.productId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoriesApi.list,
  });

  const { data: existing, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["admin", "product", params.productId],
    queryFn: () => productsApi.getBySlug(params.productId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name,
      slug: existing.slug ?? existing.id,
      slugTouched: true,
      categoryId: existing.categoryId ?? "",
      status: existing.status ?? "draft",
      bestseller: existing.bestseller ?? false,
      featured: existing.featured ?? false,
      description: existing.description,
      ingredients: existing.ingredients,
      images: existing.images?.length ? existing.images : [""],
      variants: existing.variantsDetail,
    });
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (input: ProductInput) =>
      isEdit ? productsApi.update(params.productId!, input) : productsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      navigate({ to: "/products" });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save product");
    },
  });

  function updateVariant(index: number, patch: Partial<ProductVariantInput>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function updateImage(index: number, value: string) {
    setForm((f) => ({ ...f, images: f.images.map((img, i) => (i === index ? value : img)) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input = {
      name: form.name,
      slug: form.slug,
      categoryId: form.categoryId,
      description: form.description,
      ingredients: form.ingredients,
      status: form.status,
      bestseller: form.bestseller,
      featured: form.featured,
      images: form.images.map((s) => s.trim()).filter(Boolean),
      variants: form.variants
        .filter((v) => v.weight.trim())
        .map((v) => ({ ...v, price: Number(v.price), mrp: Number(v.mrp), stock: Number(v.stock) })),
    };

    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    saveMutation.mutate(parsed.data);
  }

  if (isEdit && isLoadingExisting) {
    return (
      <AdminLayout title="Edit Product">
        <LoadingState label="Loading product..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? `Edit Product — ${form.name || params.productId}` : "Add Product"}>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Product Name"
            htmlFor="name"
            placeholder="Kambu Broken"
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: f.slugTouched ? f.slug : slugify(name),
              }));
            }}
          />
          <FormField
            label="Slug"
            htmlFor="slug"
            placeholder="kambu-broken"
            required
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))}
          />
          <FormField label="Category" htmlFor="category">
            <select
              id="category"
              required
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]"
            >
              <option value="" disabled>
                Select a category
              </option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status" htmlFor="status" hint="draft, active or archived">
            <select
              id="status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as FormState["status"] }))
              }
              className="h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </FormField>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
            <input
              type="checkbox"
              checked={form.bestseller}
              onChange={(e) => setForm((f) => ({ ...f, bestseller: e.target.checked }))}
            />
            Bestseller
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            />
            Featured
          </label>
        </div>

        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
            placeholder="Short product description..."
          />
        </FormField>

        <FormField label="Ingredients" htmlFor="ingredients">
          <textarea
            id="ingredients"
            rows={2}
            value={form.ingredients}
            onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
            className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
            placeholder="100% pearl millet..."
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--admin-text)]">
              Weights &amp; Pricing <span className="text-red-500">*</span>
            </p>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, variants: [...f.variants, { ...emptyVariant }] }))
              }
              className="flex items-center gap-1 text-xs font-medium text-[var(--admin-primary)] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add weight
            </button>
          </div>
          <div className="space-y-2">
            {form.variants.map((variant, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                <input
                  placeholder="500 g"
                  value={variant.weight}
                  onChange={(e) => updateVariant(i, { weight: e.target.value })}
                  className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={variant.price || ""}
                  onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                  className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <input
                  type="number"
                  placeholder="MRP"
                  value={variant.mrp || ""}
                  onChange={(e) => updateVariant(i, { mrp: Number(e.target.value) })}
                  className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock || ""}
                  onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                  className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <button
                  type="button"
                  disabled={form.variants.length === 1}
                  onClick={() =>
                    setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))
                  }
                  className="rounded-md p-2 text-[var(--admin-muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--admin-text)]">Image URLs</p>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, images: [...f.images, ""] }))}
              className="flex items-center gap-1 text-xs font-medium text-[var(--admin-primary)] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add image
            </button>
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            Upload a file (JPEG/PNG/WebP/GIF, max 5 MB) or paste an existing image URL.
          </p>
          {form.images.map((img, i) => (
            <div key={i} className="space-y-1.5">
              {img ? (
                <img
                  src={img}
                  alt=""
                  className="h-16 w-16 rounded-md border border-[var(--admin-border)] object-cover"
                />
              ) : null}
              <div className="flex gap-2">
                <input
                  placeholder="https://... or upload a file"
                  value={img}
                  onChange={(e) => updateImage(i, e.target.value)}
                  className="h-9 flex-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <ImageUploadButton onUploaded={(url) => updateImage(i, url)} />
                <button
                  type="button"
                  disabled={form.images.length === 1}
                  onClick={() =>
                    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
                  }
                  className="rounded-md p-2 text-[var(--admin-muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="h-10 rounded-md bg-[var(--admin-primary)] px-6 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90 disabled:opacity-60"
        >
          {saveMutation.isPending ? "Saving..." : "Save Product"}
        </button>
      </form>
    </AdminLayout>
  );
}
