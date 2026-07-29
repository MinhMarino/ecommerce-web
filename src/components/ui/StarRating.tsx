import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

export function StarRating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= rounded;
          const half = !filled && i + 0.5 === rounded;
          return (
            <Star
              key={i}
              className={cn(
                dim,
                filled ? "fill-star text-star" : half ? "fill-star/50 text-star" : "fill-transparent text-line-strong",
              )}
            />
          );
        })}
      </div>
      <span className="sr-only">{value.toFixed(1)} trên 5 sao</span>
      {count !== undefined && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </div>
  );
}
