import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X, Headphones, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.jpg.asset.json";
import { useCart } from "@/lib/cart";

const nav = [
  { label: "Home", to: "/" as const },
  { label: "Shop", to: "/shop" as const },
  { label: "Millets", to: "/shop" as const, search: { category: "millet-grains" } },
  { label: "Nuts & Seeds", to: "/shop" as const, search: { category: "nuts-seeds" } },
  { label: "Combo Packs", to: "/shop" as const, search: { category: "combo-packs" } },
  { label: "About Us", to: "/about" as const },
  { label: "Contact", to: "/contact" as const },
];

export function Header() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-olive text-paper/80 md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-4 px-6 py-2 text-[0.68rem] tracking-[0.14em] uppercase">
          <span>Our Tradition, Your Health</span>
          <span className="text-center text-gold">Free Shipping on Orders Above ₹499</span>
          <span className="flex items-center justify-end gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Track Order
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5" /> Customer Support
            </span>
          </span>
        </div>
      </div>

      <div
        className={`border-b border-gold/40 bg-paper/95 backdrop-blur transition-shadow duration-300 ${
          scrolled ? "shadow-[0_10px_30px_-24px_rgba(36,36,31,0.6)]" : ""
        }`}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:py-4">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img
              src={logo.url}
              alt="Rajadhaniyam"
              className="h-11 w-11 rounded-full object-cover ring-1 ring-gold/50"
            />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-xl tracking-wide text-olive">RAJADHANIYAM</span>
              <span className="eyebrow mt-1 text-[0.55rem] text-muted-foreground">
                Our Tradition, Your Health
              </span>
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-7 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                search={n.search as never}
                className="group relative py-1 text-[0.78rem] font-medium uppercase tracking-[0.12em] text-charcoal/80 transition-colors hover:text-olive"
                activeProps={{ className: "text-olive" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-gold transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <button aria-label="Search" className="p-2 text-charcoal/80 hover:text-olive">
              <Search className="h-[1.15rem] w-[1.15rem]" />
            </button>
            <Link
              to="/admin"
              aria-label="Account"
              className="hidden p-2 text-charcoal/80 hover:text-olive sm:block"
            >
              <User className="h-[1.15rem] w-[1.15rem]" />
            </Link>
            <button
              aria-label="Cart"
              onClick={() => setOpen(true)}
              className="relative p-2 text-charcoal/80 hover:text-olive"
            >
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" />
              {count > 0 ? (
                <span className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-full bg-terracotta text-[0.6rem] font-semibold text-paper">
                  {count}
                </span>
              ) : null}
            </button>
            <button
              aria-label="Menu"
              onClick={() => setMenu((v) => !v)}
              className="p-2 text-charcoal/80 lg:hidden"
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menu ? (
          <nav className="border-t border-border bg-paper px-6 py-4 lg:hidden">
            <ul className="flex flex-col">
              {nav.map((n) => (
                <li key={n.label} className="border-b border-border/60 last:border-0">
                  <Link
                    to={n.to}
                    search={n.search as never}
                    onClick={() => setMenu(false)}
                    className="block py-3 text-sm uppercase tracking-[0.12em] text-charcoal/85"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
