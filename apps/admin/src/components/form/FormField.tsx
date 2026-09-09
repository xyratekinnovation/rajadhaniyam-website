import type { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "children">;

/**
 * Foundation form field: label + input + error/hint text. Pass `children`
 * to render a custom control (select, textarea) instead of the default
 * <input>.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-[var(--admin-text)]">
        {label}
      </label>
      {children ?? (
        <input
          id={htmlFor}
          className="h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--admin-primary)]"
          {...inputProps}
        />
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--admin-muted)]">{hint}</p> : null}
    </div>
  );
}
