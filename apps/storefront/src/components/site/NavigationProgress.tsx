import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// A slim top-of-viewport progress bar for route transitions whose data
// takes a moment to load — without this, clicking a nav link (or Shop,
// or a category) gives zero feedback until the new page suddenly appears,
// which reads as "did my click even register?" on any load that takes more
// than an instant (e.g. Render's free-tier services waking from a cold
// start — see docs/DEPLOYMENT.md). Reading router state directly here means
// every route gets this automatically; no per-page wiring needed.
export function NavigationProgress() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }
    // Delay showing it so a navigation that resolves instantly (cached data,
    // warm server) never flashes the bar — only genuinely slow ones do.
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden bg-olive-deep/20"
      role="progressbar"
      aria-label="Loading"
    >
      <div className="h-full w-1/3 animate-nav-progress bg-gold motion-reduce:animate-none motion-reduce:w-full" />
    </div>
  );
}
