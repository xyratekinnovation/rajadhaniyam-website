import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { inr, type Product } from "@/lib/shop-data";
import { useCart } from "@/lib/cart";
import { Btn } from "./ui";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group flex flex-col border border-border/70 bg-card transition-colors duration-300 hover:border-gold">
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="relative block overflow-hidden bg-sand/40"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={900}
          height={900}
          className="aspect-square w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
        {product.bestseller ? (
          <span className="eyebrow absolute left-0 top-4 bg-terracotta px-3 py-1.5 text-paper">
            Bestseller
          </span>
        ) : null}
        {!product.inStock ? (
          <span className="eyebrow absolute right-3 top-4 bg-charcoal/85 px-3 py-1.5 text-paper">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <span className="eyebrow text-muted-foreground">{product.category}</span>
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="font-display text-xl leading-tight transition-colors hover:text-terracotta"
        >
          {product.name}
        </Link>
        <span className="text-sm text-muted-foreground">{product.weight}</span>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-display text-2xl text-olive">{inr(product.price)}</span>
          <span className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</span>
        </div>

        <Btn
          size="md"
          className="mt-3 w-full"
          disabled={!product.inStock}
          onClick={() => {
            add(product);
            toast.success(`${product.name} added to cart`);
          }}
        >
          {product.inStock ? "Add to Cart" : "Notify Me"}
        </Btn>
      </div>
    </article>
  );
}
