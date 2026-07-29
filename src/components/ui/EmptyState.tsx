import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";
import { cn } from "../../lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-muted">
        {icon ?? <PackageSearch className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-danger/25 bg-danger/5 px-6 py-14 text-center">
      <p className="text-sm font-medium text-danger">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
