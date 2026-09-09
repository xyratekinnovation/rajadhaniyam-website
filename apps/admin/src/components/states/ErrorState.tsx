import { AlertTriangle } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 py-16 text-center">
      <AlertTriangle className="mb-2 h-8 w-8 text-red-500" strokeWidth={1.5} />
      <p className="text-sm font-medium text-red-700">{title}</p>
      <p className="max-w-sm text-xs text-red-500">{description}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
