export type ClassValue = string | number | null | false | undefined;

/** Tiny classnames joiner, avoids pulling in a dependency. */
export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function discountPercent(price: number, salePrice?: number | null) {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
