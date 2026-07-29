import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-line",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Giảm số lượng"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center text-ink disabled:opacity-40 hover:bg-subtle rounded-l-lg"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="flex h-9 w-10 items-center justify-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Tăng số lượng"
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        className="flex h-9 w-9 items-center justify-center text-ink disabled:opacity-40 hover:bg-subtle rounded-r-lg"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
