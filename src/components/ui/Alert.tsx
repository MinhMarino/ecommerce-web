import type { HTMLAttributes } from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import { cn } from "../../lib/utils";

export type AlertTone = "error" | "success" | "info";

const toneStyles: Record<AlertTone, string> = {
  error: "border-danger/25 bg-danger/8 text-danger",
  success: "border-ok/25 bg-ok/8 text-ok",
  info: "border-info/25 bg-info/8 text-info",
};

const toneIcon: Record<AlertTone, typeof CircleAlert> = {
  error: CircleAlert,
  success: CheckCircle2,
  info: Info,
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
}

export function Alert({ tone = "info", className, children, ...props }: AlertProps) {
  const Icon = toneIcon[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
      <div className="text-ink/90 [&_a]:underline">{children}</div>
    </div>
  );
}
