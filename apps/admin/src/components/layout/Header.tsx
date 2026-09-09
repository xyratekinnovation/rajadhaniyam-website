import { LogOut, UserCircle } from "lucide-react";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6">
      <h1 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h1>
      <div className="flex items-center gap-4 text-sm text-[var(--admin-muted)]">
        <span className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Admin User
        </span>
        {/* TODO: wire to real admin auth/logout once Phase 5 (auth) lands */}
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-[var(--admin-bg)]">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
