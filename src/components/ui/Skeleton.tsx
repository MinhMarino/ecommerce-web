import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(110deg,var(--bg-subtle)_8%,var(--line)_18%,var(--bg-subtle)_33%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="grid gap-2 p-4">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
