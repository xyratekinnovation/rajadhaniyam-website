import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Btn, Eyebrow } from "@/components/site/ui";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Rajadhaniyam" }] }),
  component: LoginPage,
});

const field =
  "h-11 w-full border border-input bg-paper px-4 text-sm outline-none focus:border-olive";

function LoginPage() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate({ to: "/account" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-6 py-16">
        <Eyebrow>Welcome back</Eyebrow>
        <h1 className="mt-3 font-display text-4xl">Sign In</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 border border-border bg-paper p-8">
          <input
            required
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Btn type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Btn>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="text-olive underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </SiteLayout>
  );
}
