import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X, Headphones, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

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
  const { customer, isReady } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    setMenu(false);
    navigate({ to: "/shop", search: { q } as never });
  };

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
          {/* The logo artwork already contains the "Rajadhaniyam" wordmark
              and tagline, so it stands alone here rather than sitting next
              to a duplicate text lockup. */}
          <Link to="/" className="flex shrink-0 items-center">
            <img src={logo} alt="Rajadhaniyam" className="h-12 w-auto object-contain sm:h-14" />
          </Link>

          <nav className="hidden items-center justify-center gap-6 xl:flex">
            {nav.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                search={n.search as never}
                className="group relative shrink-0 whitespace-nowrap py-1 text-sm font-medium uppercase tracking-[0.08em] text-charcoal/80 transition-colors hover:text-olive"
                activeProps={{ className: "text-olive" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-gold transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <button
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 text-charcoal/80 hover:text-olive"
            >
              {searchOpen ? <X className="h-[1.15rem] w-[1.15rem]" /> : <Search className="h-[1.15rem] w-[1.15rem]" />}
            </button>
            <Link
              to={isReady && customer ? "/account" : "/login"}
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
              className="p-2 text-charcoal/80 xl:hidden"
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <form
            role="search"
            onSubmit={submitSearch}
            className="border-t border-border bg-paper px-4 py-3 sm:px-6"
          >
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                placeholder="Search millets, flours, nuts…"
                aria-label="Search products"
                className="h-11 w-full border border-input bg-paper px-4 text-sm outline-none focus:border-olive"
              />
              <button
                type="submit"
                className="h-11 shrink-0 bg-olive px-6 text-xs font-semibold uppercase tracking-[0.14em] text-paper hover:bg-olive-deep"
              >
                Search
              </button>
            </div>
          </form>
        ) : null}

        {menu ? (
          <nav className="border-t border-border bg-paper px-6 py-4 xl:hidden">
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
