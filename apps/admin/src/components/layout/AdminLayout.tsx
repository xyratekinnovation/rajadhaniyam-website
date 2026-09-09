import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[var(--admin-bg)]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </div>
    </div>
  );
}
