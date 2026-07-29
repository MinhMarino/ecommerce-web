import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type BadgeTone = "neutral" | "accent" | "ok" | "danger" | "warning" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-subtle text-ink border-line",
  accent: "bg-accent/10 text-accent border-accent/20",
  ok: "bg-ok/10 text-ok border-ok/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  warning: "bg-warning/10 text-warning border-warning/25",
  info: "bg-info/10 text-info border-info/20",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
