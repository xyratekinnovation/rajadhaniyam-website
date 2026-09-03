import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.jpg.asset.json";
import { GrainOrnament } from "./ui";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-olive text-paper/75">
      <GrainOrnament className="pointer-events-none absolute -right-6 top-8 h-56 w-24 text-gold/15" />
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
          <h3 className="eyebrow mb-4 text-gold">Shop</h3>
          <ul className="space-y-2.5 text-sm">
            {["Millet Grains", "Millet Flours", "Millet Ready Mix", "Nuts & Seeds", "Combo Packs"].map(
              (i) => (
                <li key={i}>
                  <Link to="/shop" className="transition-colors hover:text-gold">
                    {i}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4 text-gold">Company</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/about" className="transition-colors hover:text-gold">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors hover:text-gold">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/shop" className="transition-colors hover:text-gold">
                Shop All
              </Link>
            </li>
            <li>
              <Link to="/admin" className="transition-colors hover:text-gold">
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="eyebrow mb-4 text-gold">Reach Us</h3>
          <p>Chennai, Tamil Nadu, India</p>
          <p>+91 XXXXX XXXXX</p>
          <p>care@rajadhaniyam.in</p>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-[0.7rem] uppercase tracking-[0.16em] text-paper/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Rajadhaniyam</span>
          <span>Our Tradition, Your Health</span>
        </div>
      </div>
    </footer>
  );
}
