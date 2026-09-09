import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { ErrorState } from "@/components/states";
import { categoriesApi } from "@/services/api/categories";
import { ApiError } from "@/services/api/client";

export function CategoriesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: categoriesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
    onError: (err: unknown) => {
      alert(
        err instanceof ApiError && err.status === 409
          ? "Can't delete this category — it still has products assigned to it. Move or delete those first."
          : "Failed to delete category.",
      );
    },
  });

  const columns: DataTableColumn<Category>[] = [
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    { key: "description", header: "Description" },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (cat) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate({ to: "/categories/$categoryId", params: { categoryId: cat.id! } })}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-bg)] hover:text-[var(--admin-text)]"
            aria-label={`Edit ${cat.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id!);
            }}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${cat.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Categories">
      <div className="flex justify-end">
        <Link
          to="/categories/new"
          className="flex items-center gap-1.5 rounded-md bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Link>
      </div>
      {isError ? (
        <ErrorState
          title="Couldn't load categories"
          description="Check that apps/api is running and reachable."
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable<Category>
          columns={columns}
          data={categories ?? []}
          getRowId={(row) => row.id!}
          isLoading={isLoading}
          emptyTitle="No categories yet"
          emptyDescription="Add a category before creating products."
        />
      )}
    </AdminLayout>
  );
}
