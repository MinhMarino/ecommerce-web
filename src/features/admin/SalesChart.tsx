import { formatCurrency, formatDate } from "../../lib/utils";

const axisNumber = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const shortDate = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});

function getNiceMaximum(value: number) {
  if (value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function formatAxisValue(value: number) {
  return value === 0 ? "0 ₫" : `${axisNumber.format(value)} ₫`;
}

function formatShortDate(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : shortDate.format(date);
}

export function SalesChart({ data }: { data: { day: string; total: number; count: number }[] }) {
  if (!data.length) {
    return (
      <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-line bg-subtle/40 px-4 text-center">
        <div>
          <p className="text-sm font-medium text-ink">Chưa có dữ liệu doanh số</p>
          <p className="mt-1 text-xs text-muted">Dữ liệu 30 ngày gần nhất sẽ hiển thị tại đây.</p>
        </div>
      </div>
    );
  }

  const largestTotal = Math.max(...data.map((item) => Math.max(0, item.total)), 0);
  const chartMaximum = getNiceMaximum(largestTotal);
  const tickValues = Array.from({ length: 5 }, (_, index) => chartMaximum * (1 - index / 4));
  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
  const lastIndex = data.length - 1;
  const labelIndexes = new Set([
    0,
    Math.round(lastIndex * 0.25),
    Math.round(lastIndex * 0.5),
    Math.round(lastIndex * 0.75),
    lastIndex,
  ]);

  return (
    <figure aria-label="Biểu đồ doanh số 30 ngày">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-2 font-medium text-muted">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-accent" />
          Doanh thu theo ngày
        </span>
        <span className="font-medium text-muted">{totalOrders.toLocaleString("vi-VN")} đơn trong kỳ</span>
      </div>

      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3">
        <div aria-hidden="true" className="relative h-56 select-none">
          {tickValues.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className={`absolute right-0 text-[10px] tabular-nums text-muted ${
                index === 0 ? "top-0" : index === tickValues.length - 1 ? "-translate-y-full" : "-translate-y-1/2"
              }`}
              style={{ top: `${(index / (tickValues.length - 1)) * 100}%` }}
            >
              {formatAxisValue(value)}
            </span>
          ))}
        </div>

        <div className="relative h-56 border-b border-line-strong">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {tickValues.map((_, index) => (
              <span
                key={index}
                className="absolute inset-x-0 border-t border-line/80"
                style={{ top: `${(index / (tickValues.length - 1)) * 100}%` }}
              />
            ))}
          </div>

          <div className="absolute inset-0 flex items-end gap-1 sm:gap-1.5">
            {data.map((item, index) => {
              const safeTotal = Math.max(0, item.total);
              const barHeight = (safeTotal / chartMaximum) * 100;
              const tooltipPosition =
                index === 0
                  ? "left-0"
                  : index === lastIndex
                    ? "right-0"
                    : "left-1/2 -translate-x-1/2";

              return (
                <div key={item.day} className="group relative flex h-full min-w-0 flex-1 items-end">
                  <button
                    type="button"
                    aria-label={`${formatDate(item.day)}: ${formatCurrency(item.total)}, ${item.count} đơn hàng`}
                    className="flex h-full w-full items-end justify-center rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                  >
                    <span
                      aria-hidden="true"
                      className="w-full max-w-4 rounded-t-sm bg-accent/75 transition-[height,background-color] duration-200 group-hover:bg-accent group-focus-within:bg-accent"
                      style={{ height: `${barHeight}%`, minHeight: safeTotal > 0 ? 4 : 2 }}
                    />
                  </button>
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute top-2 z-20 w-max max-w-44 rounded-lg bg-ink px-2.5 py-2 text-left text-xs text-canvas opacity-0 shadow-pop transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${tooltipPosition}`}
                  >
                    <span className="block font-semibold">{formatCurrency(item.total)}</span>
                    <span className="mt-0.5 block text-canvas/70">
                      {formatDate(item.day)} · {item.count} đơn
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div aria-hidden="true" />
        <div aria-hidden="true" className="relative mt-2 h-5 select-none text-[10px] text-muted">
          {data.map((item, index) => {
            if (!labelIndexes.has(index)) return null;

            const edgeClass =
              index === 0
                ? "left-0"
                : index === lastIndex
                  ? "right-0"
                  : "-translate-x-1/2";
            const position = lastIndex === 0 ? 0 : (index / lastIndex) * 100;

            return (
              <span
                key={item.day}
                className={`absolute whitespace-nowrap tabular-nums ${edgeClass}`}
                style={index > 0 && index < lastIndex ? { left: `${position}%` } : undefined}
              >
                {formatShortDate(item.day)}
              </span>
            );
          })}
        </div>
      </div>

      <figcaption className="sr-only">
        Biểu đồ cột thể hiện doanh thu và số lượng đơn hàng theo ngày trong 30 ngày gần nhất.
      </figcaption>
    </figure>
  );
}
