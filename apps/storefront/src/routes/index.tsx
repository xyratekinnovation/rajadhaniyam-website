import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Sprout, ShieldCheck, Truck } from "lucide-react";
import heroImg from "@/assets/hero-grains.jpg";
import storyImg from "@/assets/story-hands.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { BtnLink, Divider, Eyebrow, GrainOrnament, SectionHeading } from "@/components/site/ui";
import { productService, categoryService } from "@/services";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [bestsellers, categories] = await Promise.all([
      productService.getBestsellers(),
      categoryService.getCategories(),
    ]);
    return { bestsellers, categories };
  },
  head: () => ({
    meta: [
      { title: "Rajadhaniyam — Premium Millets, Flours & Nuts" },
      {
        name: "description",
        content:
          "Naturally sourced millets, stone-ground flours, ready mixes and nuts. Our tradition, your health — delivered across India.",
      },
      { property: "og:title", content: "Rajadhaniyam — Premium Millets, Flours & Nuts" },
      {
        property: "og:description",
        content: "Naturally sourced millets, stone-ground flours and nuts from Rajadhaniyam.",
      },
    ],
  }),
  component: Index,
});

const promises = [
  { icon: Sprout, title: "Naturally Grown", text: "Sourced from small farms, no chemical polish." },
  { icon: Leaf, title: "Stone Ground", text: "Slow milled in small batches to keep nutrition." },
  { icon: ShieldCheck, title: "Lab Tested", text: "Every batch checked for purity and moisture." },
  { icon: Truck, title: "Fresh Dispatch", text: "Packed and shipped within 24 hours of order." },
];

const testimonials = [
  {
    quote:
      "The kambu is exactly like the one my grandmother used to buy from the village mill. Nothing else comes close.",
    name: "Lakshmi R.",
    city: "Coimbatore",
  },
  {
    quote:
      "We switched our whole family to Rajadhaniyam millets. The healthy mix has become our morning ritual.",
    name: "Arun Prasad",
    city: "Bengaluru",
  },
  {
    quote:
      "Beautiful packaging, honest ingredients and quick delivery. My default pantry order now.",
    name: "Divya Menon",
    city: "Chennai",
  },
];

function Index() {
  const { bestsellers, categories } = Route.useLoaderData();

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-olive text-paper">
        <img
          src={heroImg}
          alt="Clay bowls of pearl, foxtail and finger millet on a linen cloth"
          width={1600}
          height={1104}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-olive-deep via-olive-deep/80 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 lg:py-36">
          <div className="max-w-2xl space-y-7">
            <Eyebrow className="text-gold">Since the harvest of tradition</Eyebrow>
            <h1 className="text-balance font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              Our Tradition,
              <span className="block italic text-gold">Your Health.</span>
            </h1>
            <p className="max-w-lg text-pretty text-base leading-relaxed text-paper/80">
              Ancient millets, stone-ground flours and hand-picked nuts — sourced from Indian farms
              and packed the way food was always meant to be.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <BtnLink to="/shop" size="lg" variant="gold">
                Shop the Collection
              </BtnLink>
              <BtnLink
                to="/about"
                size="lg"
                className="border border-paper/30 bg-transparent text-paper hover:bg-paper/10"
              >
                Our Story
              </BtnLink>
            </div>
          </div>
        </div>
      </section>

      {/* PROMISE BAND */}
      <section className="border-b border-border bg-paper">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map((p) => (
            <div key={p.title} className="flex items-start gap-4">
              <p.icon className="mt-0.5 h-6 w-6 shrink-0 text-terracotta" strokeWidth={1.4} />
              <div>
                <h3 className="font-display text-xl leading-none">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES — editorial grid */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <SectionHeading
          eyebrow="Shop by Category"
          title="A pantry built on ancient grains"
          subtitle="Five collections, each cleaned, milled and packed in small batches."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3 lg:grid-rows-2">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className={`group relative overflow-hidden bg-charcoal ${
                i === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className={`w-full object-cover opacity-85 transition-all duration-700 group-hover:scale-105 group-hover:opacity-70 ${
                  i === 0 ? "h-72 md:h-full md:min-h-[30rem]" : "h-56"
                }`}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-3xl text-paper">{c.name}</h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-paper/70">
                  {c.description}
                </p>
                <span className="eyebrow mt-3 inline-block text-[0.6rem] text-gold">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              align="left"
              eyebrow="Loved by our kitchens"
              title="Bestsellers"
              subtitle="The staples our customers reorder month after month."
            />
            <BtnLink to="/shop" variant="outline">
              View All Products
            </BtnLink>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="relative overflow-hidden bg-ivory py-20 lg:py-28">
        <GrainOrnament className="pointer-events-none absolute -left-4 top-16 h-64 w-28 text-gold/25" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div className="relative">
            <img
              src={storyImg}
              alt="Farmer winnowing millet in a bamboo tray"
              loading="lazy"
              width={1200}
              height={1408}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute -bottom-6 -right-4 hidden bg-olive px-8 py-6 text-paper sm:block">
              <p className="font-display text-4xl leading-none text-gold">40+</p>
              <p className="eyebrow mt-2 text-[0.6rem] text-paper/70">Partner farms</p>
            </div>
          </div>
          <div className="space-y-6">
            <Eyebrow>Our Story</Eyebrow>
            <h2 className="text-balance font-display text-4xl leading-[1.08] sm:text-5xl">
              Grains that carried generations, brought back to your table
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Rajadhaniyam began with a simple question — why did the grains our grandparents ate
              disappear from our kitchens? We travelled through Tamil Nadu and Karnataka, met the
              families still growing kambu, thinai and raagi, and built a supply chain that pays
              them fairly.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nothing is polished, bleached or fortified. Grains are cleaned, sun-dried and
              stone-ground slowly so the germ and fibre stay where they belong — in your food.
            </p>
            <BtnLink to="/about" variant="outline">
              Read Our Journey
            </BtnLink>
          </div>
        </div>
      </section>

      {/* QUOTE BAND */}
      <section className="bg-olive py-20 text-center text-paper">
        <div className="mx-auto max-w-3xl px-6">
          <Divider className="mb-8" />
          <p className="text-balance font-display text-3xl italic leading-snug sm:text-4xl">
            “Real food does not need a label to explain itself.”
          </p>
          <p className="eyebrow mt-6 text-[0.6rem] text-gold">The Rajadhaniyam promise</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <SectionHeading eyebrow="From our customers" title="Kitchens that trust us" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="border border-border bg-paper p-8">
              <div className="text-gold">★★★★★</div>
              <blockquote className="mt-4 text-sm leading-relaxed text-charcoal/85">
                {t.quote}
              </blockquote>
              <figcaption className="eyebrow mt-6 text-[0.6rem] text-muted-foreground">
                {t.name} · {t.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="border-t border-border bg-sand/50 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 text-center">
          <Eyebrow>Stay in the loop</Eyebrow>
          <h2 className="font-display text-3xl sm:text-4xl">
            Recipes, harvest notes and early access
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="h-11 flex-1 border border-input bg-paper px-4 text-sm outline-none focus:border-olive"
            />
            <button className="h-11 bg-olive px-6 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-paper hover:bg-olive-deep">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
