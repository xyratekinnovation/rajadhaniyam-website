import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const btn = cva(
  "inline-flex items-center justify-center gap-2 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.14em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        solid: "bg-olive text-paper hover:bg-olive-deep active:scale-[0.985]",
        terracotta: "bg-terracotta text-paper hover:brightness-110 active:scale-[0.985]",
        outline: "border border-olive/30 text-olive hover:border-olive hover:bg-olive/5",
        gold: "border border-gold bg-transparent text-gold hover:bg-gold hover:text-charcoal",
        ghost: "text-olive hover:text-terracotta",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-14 px-9",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

type BtnProps = VariantProps<typeof btn>;

export function Btn({ className, variant, size, ...props }: ComponentProps<"button"> & BtnProps) {
  return <button className={cn(btn({ variant, size }), className)} {...props} />;
}

export function BtnLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & BtnProps) {
  return <Link className={cn(btn({ variant, size }), className)} {...props} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("eyebrow inline-flex items-center gap-3 text-terracotta", className)}>
      <span className="h-px w-8 bg-gold" aria-hidden />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="max-w-2xl text-balance font-display text-4xl leading-[1.1] sm:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function GrainOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 90" className={className} fill="none" aria-hidden>
      <path d="M20 90V34" stroke="currentColor" strokeWidth="1" />
      <g stroke="currentColor" strokeWidth="1">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <ellipse
              cx="13"
              cy={20 + i * 11}
              rx="5.5"
              ry="4"
              transform={`rotate(-25 13 ${20 + i * 11})`}
            />
            <ellipse
              cx="27"
              cy={20 + i * 11}
              rx="5.5"
              ry="4"
              transform={`rotate(25 27 ${20 + i * 11})`}
            />
          </g>
        ))}
        <ellipse cx="20" cy="12" rx="4.5" ry="8" />
      </g>
    </svg>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-gold", className)}>
      <span className="h-px w-16 bg-gold/60" />
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
        <rect x="5" y="0" width="7" height="7" transform="rotate(45 5 0)" fill="currentColor" />
      </svg>
      <span className="h-px w-16 bg-gold/60" />
    </div>
  );
}
