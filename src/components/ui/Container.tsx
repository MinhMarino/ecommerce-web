import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}

export function Section({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-10 sm:py-14", className)} {...props} />;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
