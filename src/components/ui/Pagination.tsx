import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function buildPageList(current: number, total: number) {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export function Pagination({
  meta,
  onPageChange,
  className,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (meta.totalPages <= 1) return null;
  const pages = buildPageList(meta.page, meta.totalPages);

  return (
    <nav
      aria-label="Điều hướng phân trang"
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        aria-label="Trang trước"
        disabled={meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink disabled:opacity-40 hover:bg-subtle disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {showEllipsis && <span className="px-1 text-sm text-muted">…</span>}
            <button
              type="button"
              aria-current={p === meta.page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
                p === meta.page
                  ? "bg-accent text-accent-ink"
                  : "border border-line text-ink hover:bg-subtle",
              )}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        aria-label="Trang sau"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink disabled:opacity-40 hover:bg-subtle disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
