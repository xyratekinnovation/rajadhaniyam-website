import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Truck, RotateCcw, Star } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Btn, Eyebrow, SectionHeading } from "@/components/site/ui";
import { inr, products } from "@/lib/shop-data";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$productId")({
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product not found — Rajadhaniyam" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — Rajadhaniyam` },
        { name: "description", content: product.description.slice(0, 155) },
        { property: "og:title", content: `${product.name} — Rajadhaniyam` },
        { property: "og:description", content: product.description.slice(0, 155) },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { add } = useCart();
  const [weight, setWeight] = useState(product.weight);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "nutrition" | "shipping">("desc");

  const related = products.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 3);

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-2 lg:py-16">
        <div className="space-y-4">
          <img
            src={product.image}
            alt={product.name}
            width={900}
            height={900}
            className="aspect-square w-full border border-border object-cover"
          />
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <img
                key={i}
                src={product.image}
                alt=""
                loading="lazy"
                className="aspect-square w-full border border-border object-cover opacity-80"
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Eyebrow>{product.category}</Eyebrow>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>

          <div className="flex items-center gap-3 text-sm">
            <span className="flex text-gold">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-current" strokeWidth={0} />
              ))}
            </span>
            <span className="text-muted-foreground">
              {product.rating} · {product.reviews} reviews
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl text-olive">{inr(product.price)}</span>
            <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
            <span className="bg-terracotta px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-paper">
              Save {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
            </span>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          <div>
            <p className="eyebrow text-[0.6rem] text-muted-foreground">Size</p>
            <div className="mt-3 flex gap-3">
              {product.weights.map((w) => (
                <button
                  key={w}
                  onClick={() => setWeight(w)}
                  className={`h-10 border px-5 text-sm transition-colors ${
                    weight === w ? "border-olive bg-olive text-paper" : "border-input hover:border-olive"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 items-center border border-input">
              <button className="px-4" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                −
              </button>
              <span className="min-w-10 text-center text-sm">{qty}</span>
              <button className="px-4" onClick={() => setQty((q) => q + 1)} aria-label="Increase">
                +
              </button>
            </div>
            <Btn
              size="lg"
              className="flex-1"
              disabled={!product.inStock}
              onClick={() => {
                add(product, weight, qty);
                toast.success(`${product.name} added to cart`);
              }}
            >
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </Btn>
          </div>

          <ul className="grid gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-olive" /> Free shipping above ₹499
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-olive" /> 7-day easy returns
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-olive" /> 100% natural
            </li>
          </ul>

          <div className="border-t border-border pt-6">
            <div className="flex gap-6 border-b border-border">
              {(
                [
                  ["desc", "Ingredients"],
                  ["nutrition", "Nutrition"],
                  ["shipping", "Shipping"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`-mb-px border-b-2 pb-3 text-[0.72rem] uppercase tracking-[0.12em] ${
                    tab === k ? "border-olive text-olive" : "border-transparent text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="pt-5 text-sm leading-relaxed text-muted-foreground">
              {tab === "desc" ? <p>{product.ingredients}</p> : null}
              {tab === "nutrition" ? (
                <table className="w-full max-w-sm text-sm">
                  <tbody>
                    {product.nutrition.map((n) => (
                      <tr key={n.label} className="border-b border-border/70">
                        <td className="py-2">{n.label}</td>
                        <td className="py-2 text-right text-charcoal">{n.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {tab === "shipping" ? (
                <p>
                  Dispatched within 24 hours from Coimbatore. Delivery in 2–5 working days across
                  India. Free above ₹499, flat ₹49 otherwise.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="bg-paper py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading align="left" eyebrow="You may also like" title="Pairs well with" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </SiteLayout>
  );
}
