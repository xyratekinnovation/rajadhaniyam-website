import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FormField } from "@/components/form/FormField";
import { adminLogin } from "@/services/api/auth";
import { setSession } from "@/lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { token, admin } = await adminLogin(email, password);
      setSession(token, admin);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--admin-bg)] px-4">
      <form
        onSubmit={handleSubmit}
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
          placeholder="admin@rajadhaniyam.in"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="Password"
          htmlFor="password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full rounded-md bg-[var(--admin-primary)] text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
