import { formatCurrency, formatDate } from "../../lib/utils";

export function SalesChart({ data }: { data: { day: string; total: number; count: number }[] }) {
  if (!data.length) {
    return <p className="text-sm text-muted">Chưa có dữ liệu doanh số trong 30 ngày qua.</p>;
  }

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div>
      <div className="flex h-48 items-end gap-1">
        {data.map((d) => (
          <div key={d.day} className="group relative flex-1">
            <div
              className="rounded-t-sm bg-accent/80 transition-colors group-hover:bg-accent"
              style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs text-canvas opacity-0 shadow-pop transition-opacity group-hover:opacity-100">
              <p className="font-semibold">{formatCurrency(d.total)}</p>
              <p className="text-canvas/70">{formatDate(d.day)} · {d.count} đơn</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{formatDate(data[0]?.day)}</span>
        <span>{formatDate(data[data.length - 1]?.day)}</span>
      </div>
    </div>
  );
}
