import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-[var(--admin-muted)]">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
