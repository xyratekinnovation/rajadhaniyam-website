import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Eyebrow } from "@/components/site/ui";
import { cn } from "@/lib/utils";
import { productService, categoryService } from "@/services";

type Search = { category?: string; sort?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const result: Search = {};
    if (typeof search["category"] === "string") result.category = search["category"];
    if (typeof search["sort"] === "string") result.sort = search["sort"];
    return result;
  },
  loader: async () => {
    const [products, categories] = await Promise.all([
      productService.getProducts(),
      categoryService.getCategories(),
    ]);
    return { products, categories };
  },
  head: () => ({
    meta: [
      { title: "Shop Millets, Flours & Nuts — Rajadhaniyam" },
      {
        name: "description",
        content:
          "Browse millet grains, stone-ground flours, ready mixes, nuts, seeds and curated combo packs from Rajadhaniyam.",
      },
      { property: "og:title", content: "Shop Millets, Flours & Nuts — Rajadhaniyam" },
      {
        property: "og:description",
        content: "Millet grains, flours, ready mixes, nuts and combo packs, freshly packed.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category, sort } = Route.useSearch();
  const { products, categories } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [maxPrice, setMaxPrice] = useState(1200);

  const list = useMemo(() => {
    let l = products.filter((p) => (category ? p.categorySlug === category : true));
    l = l.filter((p) => p.price <= maxPrice);
    if (sort === "price-asc") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") l = [...l].sort((a, b) => b.price - a.price);
    if (sort === "rating") l = [...l].sort((a, b) => b.rating - a.rating);
    return l;
  }, [products, category, sort, maxPrice]);

  const active = categories.find((c) => c.slug === category);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-olive py-16 text-paper">
        <div className="mx-auto max-w-7xl px-6">
          <Eyebrow className="text-gold">The Collection</Eyebrow>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl">
            {active ? active.name : "All Products"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-paper/70">
            {active ? active.description : "Every grain, flour and nut we carry, in one place."}
          </p>
        </div>
      </section>

      {/* CATEGORY CHIP RAIL — horizontally scrollable so it works as well on
          mobile as desktop, reusing the same category photos as the
          homepage's "Shop by Category" section instead of a plain text list. */}
      <div className="border-b border-border bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex gap-6 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              to="/shop"
              search={sort ? { sort } : {}}
              className="flex flex-shrink-0 flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full border-2 bg-sand/50 font-display text-sm transition-colors",
                  !category ? "border-olive text-olive" : "border-transparent text-charcoal/70",
                )}
              >
                All
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs",
                  !category ? "font-semibold text-olive" : "text-muted-foreground",
                )}
              >
                All Products
              </span>
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/shop"
                search={sort ? { category: c.slug, sort } : { category: c.slug }}
                className="flex flex-shrink-0 flex-col items-center gap-2"
              >
                <span
                  className={cn(
                    "h-16 w-16 overflow-hidden rounded-full border-2 transition-colors",
                    category === c.slug ? "border-olive" : "border-transparent",
                  )}
                >
                  <img
                    src={c.image}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    category === c.slug ? "font-semibold text-olive" : "text-muted-foreground",
                  )}
                >
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-8">
          <div>
            <h2 className="eyebrow text-[0.62rem] text-muted-foreground">Max Price</h2>
            <input
              type="range"
              min={80}
              max={1200}
              step={20}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-4 w-full accent-olive"
            />
            <p className="mt-1 text-xs text-muted-foreground">Up to ₹{maxPrice}</p>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-xs text-muted-foreground">{list.length} products</p>
            <select
              value={sort ?? ""}
              onChange={(e) =>
                navigate({
                  to: ".",
                  search: (prev) => {
                    const { sort: _sort, ...rest } = prev;
                    return e.target.value ? { ...rest, sort: e.target.value } : rest;
                  },
                })
              }
              className="h-9 border border-input bg-paper px-3 text-xs uppercase tracking-[0.1em]"
            >
              <option value="">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {list.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">
              No products match these filters.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
