import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HomepageHeroInput } from "@rajadhaniyam/shared";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { FormField } from "@/components/form/FormField";
import { ImageUploadButton } from "@/components/form/ImageUploadButton";
import { LoadingState } from "@/components/states";
import { contentApi } from "@/services/api/content";

// Mirrors the hardcoded copy in apps/storefront/src/routes/index.tsx — what
// the homepage shows until an admin saves a real override, and what this
// form starts from so editing feels like "tweak the current hero," not
// "fill in a blank form."
const DEFAULT_HERO: HomepageHeroInput = {
  eyebrow: "Since the harvest of tradition",
  heading: "Our Tradition,",
  headingAccent: "Your Health.",
  subtitle:
    "Ancient millets, stone-ground flours and hand-picked nuts — sourced from Indian farms and packed the way food was always meant to be.",
  image: "/assets/hero-grains.jpg",
  ctaText: "Shop the Collection",
  ctaLink: "/shop",
};

export function ContentPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HomepageHeroInput>(DEFAULT_HERO);
  const [savedMessage, setSavedMessage] = useState(false);

  const { data: hero, isLoading } = useQuery({
    queryKey: ["admin", "content", "hero"],
    queryFn: contentApi.getHero,
  });

  useEffect(() => {
    if (hero) setForm(hero);
  }, [hero]);

  const saveMutation = useMutation({
    mutationFn: (input: HomepageHeroInput) => contentApi.setHero(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "content", "hero"], updated);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  if (isLoading) {
    return (
      <AdminLayout title="Website Content">
        <LoadingState label="Loading content..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Website Content">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
      >
        <div>
          <h2 className="text-sm font-medium text-[var(--admin-text)]">Homepage Hero</h2>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            {hero
              ? "Editing the live homepage hero."
              : "No override saved yet — this form starts from the current hardcoded copy. Saving replaces it on the live site immediately."}
          </p>
        </div>

        <FormField
          label="Eyebrow"
          htmlFor="eyebrow"
          required
          value={form.eyebrow}
          onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Heading"
            htmlFor="heading"
            required
            value={form.heading}
            onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
          />
          <FormField
            label="Heading Accent (italic line)"
            htmlFor="headingAccent"
            required
            value={form.headingAccent}
            onChange={(e) => setForm((f) => ({ ...f, headingAccent: e.target.value }))}
          />
        </div>
        <FormField label="Subtitle" htmlFor="subtitle">
          <textarea
            id="subtitle"
            required
            rows={3}
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
          />
        </FormField>

        <FormField label="Hero Image" htmlFor="image">
          <div className="space-y-1.5">
            {form.image ? (
              <img
                src={form.image}
                alt=""
                className="h-24 w-full max-w-xs rounded-md border border-[var(--admin-border)] object-cover"
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
            label="Button Text"
            htmlFor="ctaText"
            required
            value={form.ctaText}
            onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
          />
          <FormField
            label="Button Link"
            htmlFor="ctaLink"
            required
            value={form.ctaLink}
            onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
          />
        </div>

        {savedMessage ? (
          <p className="text-sm text-green-600">Saved — live on the homepage now.</p>
        ) : null}
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="h-10 rounded-md bg-[var(--admin-primary)] px-6 text-sm font-semibold text-[var(--admin-primary-foreground)] hover:opacity-90 disabled:opacity-60"
        >
          {saveMutation.isPending ? "Saving..." : "Save Hero"}
        </button>
      </form>
    </AdminLayout>
  );
}
