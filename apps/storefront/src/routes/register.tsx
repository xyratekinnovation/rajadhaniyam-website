import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Btn, Eyebrow } from "@/components/site/ui";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — Rajadhaniyam" }] }),
  component: RegisterPage,
});

const field =
  "h-11 w-full border border-input bg-paper px-4 text-sm outline-none focus:border-olive";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate({ to: "/account" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-6 py-16">
        <Eyebrow>Join Rajadhaniyam</Eyebrow>
        <h1 className="mt-3 font-display text-4xl">Create Account</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 border border-border bg-paper p-8">
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
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
            placeholder="Password (min. 8 characters)"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Btn type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Btn>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-olive underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </SiteLayout>
  );
}
