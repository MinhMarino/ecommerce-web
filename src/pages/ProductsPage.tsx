import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import { api } from "../lib/api";
import { useDebouncedValue } from "../lib/hooks";
import { cn, formatCurrency } from "../lib/utils";
import type { Brand, Category, Paginated, ProductSummary } from "../lib/types";
import { Container } from "../components/ui/Container";
import { ProductGrid } from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { Input, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "bestseller", label: "Bán chạy" },
  { value: "popular", label: "Phổ biến" },
  { value: "price_asc", label: "Giá: Thấp đến cao" },
  { value: "price_desc", label: "Giá: Cao đến thấp" },
];

const RATING_OPTIONS = [4, 3, 2, 1];

function FilterPanel({
  categories,
  brands,
  params,
  onChange,
}: {
  categories: Category[];
  brands: Brand[];
  params: URLSearchParams;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const debouncedMin = useDebouncedValue(minPrice, 500);
  const debouncedMax = useDebouncedValue(maxPrice, 500);

  useEffect(() => {
    onChange({ minPrice: debouncedMin || null, maxPrice: debouncedMax || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax]);

  const activeCategory = params.get("category");
  const activeBrand = params.get("brand");
  const activeRating = params.get("minRating");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Danh mục</h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onChange({ category: null })}
            className={cn(
              "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm",
              !activeCategory ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-subtle",
            )}
          >
            Tất cả danh mục
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange({ category: c.slug })}
              className={cn(
                "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm",
                activeCategory === c.slug ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-subtle",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Thương hiệu</h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onChange({ brand: null })}
            className={cn(
              "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm",
              !activeBrand ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-subtle",
            )}
          >
            Tất cả thương hiệu
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange({ brand: b.slug })}
              className={cn(
                "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm",
                activeBrand === b.slug ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-subtle",
              )}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Khoảng giá</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Từ"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-9 text-sm"
          />
          <span className="text-muted">—</span>
          <Input
            type="number"
            min={0}
            placeholder="Đến"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Đánh giá</h3>
        <div className="space-y-1.5">
          {RATING_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ minRating: activeRating === String(r) ? null : String(r) })}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-sm",
                activeRating === String(r) ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-subtle",
              )}
            >
              {"★".repeat(r)}
              {"☆".repeat(5 - r)} <span className="ml-1">từ {r} sao</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={params.get("inStock") === "true"}
            onChange={(e) => onChange({ inStock: e.target.checked ? "true" : null })}
            className="h-4 w-4 rounded border-line-strong accent-[var(--accent)]"
          />
          Còn hàng
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={params.get("onSale") === "true"}
            onChange={(e) => onChange({ onSale: e.target.checked ? "true" : null })}
            className="h-4 w-4 rounded border-line-strong accent-[var(--accent)]"
          />
          Đang giảm giá
        </label>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<ProductSummary> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const sort = params.get("sort") ?? "newest";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams(params);
      if (!qs.get("sort")) qs.set("sort", "newest");
      qs.set("pageSize", "12");
      const data = await api<Paginated<ProductSummary>>(`/api/v1/products?${qs.toString()}`, {
        auth: false,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    Promise.all([
      api<{ items: Category[] }>("/api/v1/categories", { auth: false }),
      api<{ items: Brand[] }>("/api/v1/brands", { auth: false }),
    ])
      .then(([c, b]) => {
        setCategories(c.items);
        setBrands(b.items);
      })
      .catch(() => undefined);
  }, []);

  function patch(next: Record<string, string | null>) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) merged.delete(key);
      else merged.set(key, value);
    }
    merged.delete("page");
    setParams(merged);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    patch({ q: q.trim() || null });
  }

  function onPageChange(page: number) {
    const merged = new URLSearchParams(params);
    merged.set("page", String(page));
    setParams(merged);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeFilterCount = ["category", "brand", "minPrice", "maxPrice", "minRating", "inStock", "onSale"].filter(
    (k) => params.get(k),
  ).length;

  const items = result?.items.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    salePrice: p.salePrice,
    image: p.images?.[0]?.url,
    isFlashSale: p.isFlashSale,
    soldCount: p.soldCount,
  })) ?? [];

  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">Sản phẩm</h1>
        <p className="text-sm text-muted">
          {result ? `${result.pagination.total} sản phẩm` : "Đang tải danh sách sản phẩm"}
        </p>
      </div>

      <form onSubmit={onSearchSubmit} className="mb-5 flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, mô tả, SKU..."
          icon={<PackageSearch className="h-4 w-4" />}
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Tìm
        </Button>
        <Button
          type="button"
          variant="outline"
          className="lg:hidden"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="h-4 w-4" /> Lọc
          {activeFilterCount > 0 && <Badge tone="accent">{activeFilterCount}</Badge>}
        </Button>
      </form>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <FilterPanel categories={categories} brands={brands} params={params} onChange={patch} />
        </aside>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Đóng bộ lọc"
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-surface p-5 shadow-pop">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <SlidersHorizontal className="h-4.5 w-4.5" /> Bộ lọc
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-subtle"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterPanel categories={categories} brands={brands} params={params} onChange={patch} />
              <Button className="mt-6" onClick={() => setMobileFiltersOpen(false)}>
                Xem kết quả
              </Button>
            </div>
          </div>
        )}

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {params.get("category") && (
                <Badge tone="accent" className="cursor-pointer" onClick={() => patch({ category: null })}>
                  {categories.find((c) => c.slug === params.get("category"))?.name ?? params.get("category")} <X className="h-3 w-3" />
                </Badge>
              )}
              {params.get("brand") && (
                <Badge tone="accent" className="cursor-pointer" onClick={() => patch({ brand: null })}>
                  {brands.find((b) => b.slug === params.get("brand"))?.name ?? params.get("brand")} <X className="h-3 w-3" />
                </Badge>
              )}
              {(params.get("minPrice") || params.get("maxPrice")) && (
                <Badge
                  tone="accent"
                  className="cursor-pointer"
                  onClick={() => patch({ minPrice: null, maxPrice: null })}
                >
                  {formatCurrency(Number(params.get("minPrice")) || 0)} - {params.get("maxPrice") ? formatCurrency(Number(params.get("maxPrice"))) : "∞"} <X className="h-3 w-3" />
                </Badge>
              )}
            </div>

            <Select
              value={sort}
              onChange={(e) => patch({ sort: e.target.value })}
              className="w-auto"
              aria-label="Sắp xếp theo"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sắp xếp: {o.label}
                </option>
              ))}
            </Select>
          </div>

          {error && <ErrorState message={error} onRetry={load} />}

          {!error && loading && <ProductGridSkeleton count={12} />}

          {!error && !loading && items.length === 0 && (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              description="Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm."
              action={
                <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
                  Xóa tất cả bộ lọc
                </Button>
              }
            />
          )}

          {!error && !loading && items.length > 0 && (
            <>
              <ProductGrid items={items} />
              {result && (
                <Pagination meta={result.pagination} onPageChange={onPageChange} className="mt-10" />
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
