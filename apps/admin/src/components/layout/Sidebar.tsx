import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Boxes,
  Ticket,
  Image,
  FileText,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/coupons", label: "Coupons", icon: Ticket },
  { to: "/banners", label: "Banners", icon: Image },
  { to: "/content", label: "Website Content", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <div className="flex h-16 items-center border-b border-[var(--admin-border)] px-5">
        <span className="text-sm font-semibold tracking-wide text-[var(--admin-text)]">
          Rajadhaniyam <span className="text-[var(--admin-primary)]">Admin</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-[var(--admin-primary)] text-[var(--admin-primary-foreground)]"
                  : "text-[var(--admin-text)] hover:bg-[var(--admin-bg)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
