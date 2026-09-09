import { FormField } from "@/components/form/FormField";

export function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--admin-bg)] px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: wire to POST /auth/admin/login once apps/api auth module ships (Phase 5)
        }}
        className="w-full max-w-sm space-y-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 shadow-sm"
      >
        <div>
          <h1 className="text-lg font-semibold text-[var(--admin-text)]">Rajadhaniyam Admin</h1>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">Sign in to manage the store</p>
        </div>
        <FormField
          label="Email"
          htmlFor="email"
          type="email"
          placeholder="admin@rajadhaniyam.com"
          required
        />
        <FormField
          label="Password"
          htmlFor="password"
          type="password"
          placeholder="••••••••"
          required
        />
        <button
          type="submit"
          className="h-10 w-full rounded-md bg-[var(--admin-primary)] text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
