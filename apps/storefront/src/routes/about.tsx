import { createFileRoute } from "@tanstack/react-router";
import storyImg from "@/assets/story-hands.jpg";
import heroImg from "@/assets/hero-grains.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BtnLink, Divider, Eyebrow, SectionHeading } from "@/components/site/ui";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Rajadhaniyam" },
      {
        name: "description",
        content:
          "How Rajadhaniyam works with 40+ Indian farms to bring back ancient millets, stone-ground flours and honest pantry staples.",
      },
      { property: "og:title", content: "Our Story — Rajadhaniyam" },
      {
        property: "og:description",
        content:
          "Ancient grains, fair farm partnerships and slow milling — the Rajadhaniyam story.",
      },
    ],
  }),
  component: About,
});

const milestones = [
  { year: "2016", text: "A family kitchen in Coimbatore starts milling raagi for neighbours." },
  { year: "2019", text: "First eight farm partnerships signed with direct, fair pricing." },
  { year: "2022", text: "Own cleaning and stone-milling unit opens; lab testing begins." },
  { year: "2026", text: "40+ partner farms and pantry orders shipping across India." },
];

const values = [
  {
    title: "Honest Sourcing",
    text: "We buy direct, pay above mandi rates and name every farm region.",
  },
  { title: "Slow Milling", text: "Stone mills run cool and slow so the germ and fibre survive." },
  { title: "Nothing Added", text: "No polish, no bleach, no preservatives, no synthetic colour." },
];

function About() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-charcoal text-paper">
        <img
          src={heroImg}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <Eyebrow className="justify-center text-gold">Est. 2016 · Coimbatore</Eyebrow>
          <h1 className="mt-6 text-balance font-display text-5xl leading-tight sm:text-6xl">
            We bring back the grains that raised us
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2">
        <img
          src={storyImg}
          alt="Winnowing millet by hand"
          loading="lazy"
          width={1200}
          height={1408}
          className="aspect-[4/5] w-full object-cover"
        />
        <div className="space-y-5">
          <Eyebrow>The beginning</Eyebrow>
          <h2 className="font-display text-4xl leading-tight">
            From a home mill to a pantry brand
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Rajadhaniyam started as a small stone mill in a Coimbatore backyard, grinding raagi for
            families who could no longer find it unpolished. Word travelled, and so did we — into
            the millet belts of Tamil Nadu, Karnataka and Andhra Pradesh.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Today every batch is traceable to the farms it came from, cleaned in our own unit and
            tested before it is packed. The scale changed. The standard did not.
          </p>
        </div>
      </section>

      <section className="bg-olive py-20 text-paper">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeading eyebrow="Milestones" title="Our journey" className="[&_h2]:text-paper" />
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => (
              <li key={m.year} className="border-t border-gold/50 pt-5">
                <p className="font-display text-4xl text-gold">{m.year}</p>
                <p className="mt-3 text-xs leading-relaxed text-paper/75">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading eyebrow="What we stand for" title="Three rules we never bend" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="border border-border bg-paper p-8">
              <h3 className="font-display text-2xl">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
        <Divider className="my-14" />
        <div className="text-center">
          <BtnLink to="/shop" size="lg">
            Explore the Collection
          </BtnLink>
        </div>
      </section>
    </SiteLayout>
  );
}
