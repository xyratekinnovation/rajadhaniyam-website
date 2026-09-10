import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.jpg.asset.json";
import { GrainOrnament } from "./ui";
import { ADMIN_URL } from "@/lib/admin-url";

// Underlined-on-hover link style shared by every footer column — a plain
// color change (the old style) reads as static; the underline sliding in
// gives the links some life without needing new assets or icons.
const footerLink =
  "relative inline-block py-0.5 text-paper/75 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-paper hover:after:scale-x-100";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-olive text-paper/75">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
        aria-hidden
      />
      <GrainOrnament className="pointer-events-none absolute -right-6 top-8 hidden h-56 w-24 text-gold/15 sm:block" />
      <GrainOrnament className="pointer-events-none absolute -left-6 bottom-8 hidden h-56 w-24 rotate-180 text-gold/10 lg:block" />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={logo.url}
              alt="Rajadhaniyam"
              className="h-12 w-12 rounded-full object-cover ring-1 ring-gold/50"
            />
            <span className="font-display text-2xl tracking-wide text-paper">RAJADHANIYAM</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed">
            Ancient grains and naturally sourced foods, brought to your table with the care of a
            family kitchen.
          </p>
        </div>

        <div>
          <h3 className="eyebrow mb-5 text-gold">Shop</h3>
          <ul className="space-y-3 text-sm">
            {[
              { label: "Millet Grains", slug: "millet-grains" },
              { label: "Millet Flours", slug: "millet-flours" },
              { label: "Millet Ready Mix", slug: "millet-ready-mix" },
              { label: "Nuts & Seeds", slug: "nuts-seeds" },
              { label: "Combo Packs", slug: "combo-packs" },
            ].map((i) => (
              <li key={i.slug}>
                <Link to="/shop" search={{ category: i.slug }} className={footerLink}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-5 text-gold">Company</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/about" className={footerLink}>
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className={footerLink}>
                Contact
              </Link>
            </li>
            <li>
              <Link to="/shop" className={footerLink}>
                Shop All
              </Link>
            </li>
            <li>
              <a href={ADMIN_URL} className={footerLink}>
                Admin Panel
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-5 text-gold">Reach Us</h3>
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
              <span>Rajadhaniyam Foods, 14 Mill Road, Peelamedu, Coimbatore 641004, Tamil Nadu</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 flex-shrink-0 text-gold" />
              <span>+91 98400 12345</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 flex-shrink-0 text-gold" />
              <span>care@rajadhaniyam.in</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-[0.7rem] uppercase tracking-[0.16em] text-paper/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Rajadhaniyam</span>
          <span>Our Tradition, Your Health</span>
        </div>
      </div>
    </footer>
  );
}
