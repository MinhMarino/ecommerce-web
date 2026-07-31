import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Container } from "../../components/ui/Container";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";
import { Input, Select } from "../../components/ui/Input";
import { Pagination } from "../../components/ui/Pagination";
import { ProductGridSkeleton } from "../../components/ui/Skeleton";
import { api } from "../../lib/api";
import { useLockBodyScroll } from "../../lib/hooks";
import type { Brand, Category, Paginated, ProductSummary } from "../../lib/types";
import { cn, formatCurrency } from "../../lib/utils";
import { ProductGrid } from "./ProductCard";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "bestseller", label: "Bán chạy" },
  { value: "popular", label: "Phổ biến" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
] as const;

const RATING_OPTIONS = [4, 3, 2, 1] as const;
const FILTER_KEYS = [
  "category",
  "brand",
  "minPrice",
  "maxPrice",
  "minRating",
  "inStock",
  "onSale",
  "flashSale",
  "featured",
] as const;

type FilterPatch = Record<string, string | null>;

function FilterPanel({
  categories,
  brands,
  params,
  activeCount,
  onChange,
  onClear,
}: {
  categories: Category[];
  brands: Brand[];
  params: URLSearchParams;
  activeCount: number;
  onChange: (patch: FilterPatch) => void;
  onClear: () => void;
}) {
  const paramMinPrice = params.get("minPrice") ?? "";
  const paramMaxPrice = params.get("maxPrice") ?? "";
  const [minPrice, setMinPrice] = useState(paramMinPrice);
  const [maxPrice, setMaxPrice] = useState(paramMaxPrice);

  useEffect(() => setMinPrice(paramMinPrice), [paramMinPrice]);
  useEffect(() => setMaxPrice(paramMaxPrice), [paramMaxPrice]);

  const activeCategory = params.get("category");
  const activeBrand = params.get("brand");
  const activeRating = params.get("minRating");

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ minPrice: minPrice.trim() || null, maxPrice: maxPrice.trim() || null });
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">Bộ lọc</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Danh mục</legend>
        <div className="max-h-56 space-y-1 overflow-y-auto pr-1 no-scrollbar">
          <button
            type="button"
            aria-pressed={!activeCategory}
            onClick={() => onChange({ category: null })}
            className={cn(
              "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
              !activeCategory ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-subtle hover:text-ink",
            )}
          >
            Tất cả danh mục
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={activeCategory === category.slug}
              onClick={() => onChange({ category: category.slug })}
              className={cn(
                "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                activeCategory === category.slug
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-muted hover:bg-subtle hover:text-ink",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Thương hiệu</legend>
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1 no-scrollbar">
          <button
            type="button"
            aria-pressed={!activeBrand}
            onClick={() => onChange({ brand: null })}
            className={cn(
              "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
              !activeBrand ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-subtle hover:text-ink",
            )}
          >
            Tất cả thương hiệu
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              aria-pressed={activeBrand === brand.slug}
              onClick={() => onChange({ brand: brand.slug })}
              className={cn(
                "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                activeBrand === brand.slug
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-muted hover:bg-subtle hover:text-ink",
              )}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </fieldset>

      <form onSubmit={applyPrice}>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Khoảng giá</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Từ"
            aria-label="Giá tối thiểu"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="h-10 px-3"
          />
          <span className="text-muted" aria-hidden>–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Đến"
            aria-label="Giá tối đa"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="h-10 px-3"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" className="mt-2.5 w-full">
          Áp dụng khoảng giá
        </Button>
      </form>

      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Đánh giá</legend>
        <div className="space-y-1">
          {RATING_OPTIONS.map((rating) => (
            <button
              key={rating}
              type="button"
              aria-pressed={activeRating === String(rating)}
              onClick={() => onChange({ minRating: activeRating === String(rating) ? null : String(rating) })}
              className={cn(
                "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
                activeRating === String(rating)
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-muted hover:bg-subtle hover:text-ink",
              )}
            >
              <span className="text-star" aria-hidden>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>
              <span className="ml-2">Từ {rating} sao</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Tình trạng</legend>
        <div className="grid gap-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={params.get("inStock") === "true"}
              onChange={(event) => onChange({ inStock: event.target.checked ? "true" : null })}
              className="h-4 w-4 rounded border-line-strong accent-accent"
            />
            Còn hàng
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={params.get("onSale") === "true"}
              onChange={(event) => onChange({ onSale: event.target.checked ? "true" : null })}
              className="h-4 w-4 rounded border-line-strong accent-accent"
            />
            Đang giảm giá
          </label>
        </div>
      </fieldset>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Bỏ bộ lọc ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {label} <X className="h-3 w-3" aria-hidden />
    </button>
  );
}

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<ProductSummary> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const requestId = useRef(0);
  const queryString = params.toString();
  const currentQuery = params.get("q") ?? "";
  const sort = params.get("sort") ?? "newest";

  useLockBodyScroll(mobileFiltersOpen);

  useEffect(() => setQuery(currentQuery), [currentQuery]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileFiltersOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileFiltersOpen]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const nextParams = new URLSearchParams(queryString);
      if (!nextParams.has("sort")) nextParams.set("sort", "newest");
      nextParams.set("pageSize", "12");
      const data = await api<Paginated<ProductSummary>>(`/api/v1/products?${nextParams.toString()}`, {
        auth: false,
      });
      if (id === requestId.current) setResult(data);
    } catch (requestError) {
      if (id === requestId.current) {
        setError(requestError instanceof Error ? requestError.message : "Không thể tải sản phẩm");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    Promise.all([
      api<{ items: Category[] }>("/api/v1/categories", { auth: false }),
      api<{ items: Brand[] }>("/api/v1/brands", { auth: false }),
    ])
      .then(([categoryData, brandData]) => {
        setCategories(categoryData.items);
        setBrands(brandData.items);
      })
      .catch(() => undefined);
  }, []);

  const patch = useCallback(
    (next: FilterPatch) => {
      const merged = new URLSearchParams(params);
      for (const [key, value] of Object.entries(next)) {
        if (value === null) merged.delete(key);
        else merged.set(key, value);
      }
      merged.delete("page");
      setParams(merged);
    },
    [params, setParams],
  );

  function clearFilters() {
    patch({
      category: null,
      brand: null,
      minPrice: null,
      maxPrice: null,
      minRating: null,
      inStock: null,
      onSale: null,
      flashSale: null,
      featured: null,
    });
  }

  function resetEverything() {
    setQuery("");
    setParams(new URLSearchParams());
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    patch({ q: query.trim() || null });
  }

  function onPageChange(page: number) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("page", String(page));
    setParams(nextParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeFilterCount = FILTER_KEYS.filter((key) => params.has(key)).length;
  const items =
    result?.items.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images?.[0]?.url,
      isFlashSale: product.isFlashSale,
      soldCount: product.soldCount,
      ratingCount: product.reviewCount,
    })) ?? [];

  const filterChips: { key: string; label: string; clear: () => void }[] = [];
  const categorySlug = params.get("category");
  const brandSlug = params.get("brand");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const minRating = params.get("minRating");

  if (categorySlug) {
    filterChips.push({
      key: "category",
      label: categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug,
      clear: () => patch({ category: null }),
    });
  }
  if (brandSlug) {
    filterChips.push({
      key: "brand",
      label: brands.find((brand) => brand.slug === brandSlug)?.name ?? brandSlug,
      clear: () => patch({ brand: null }),
    });
  }
  if (minPrice || maxPrice) {
    filterChips.push({
      key: "price",
      label: `${minPrice ? formatCurrency(Number(minPrice)) : "0 ₫"} – ${maxPrice ? formatCurrency(Number(maxPrice)) : "Không giới hạn"}`,
      clear: () => patch({ minPrice: null, maxPrice: null }),
    });
  }
  if (minRating) {
    filterChips.push({ key: "rating", label: `Từ ${minRating} sao`, clear: () => patch({ minRating: null }) });
  }
  if (params.get("inStock") === "true") {
    filterChips.push({ key: "stock", label: "Còn hàng", clear: () => patch({ inStock: null }) });
  }
  if (params.get("onSale") === "true") {
    filterChips.push({ key: "sale", label: "Đang giảm giá", clear: () => patch({ onSale: null }) });
  }
  if (params.get("flashSale") === "true") {
    filterChips.push({ key: "flash", label: "Flash sale", clear: () => patch({ flashSale: null }) });
  }
  if (params.get("featured") === "true") {
    filterChips.push({ key: "featured", label: "Nổi bật", clear: () => patch({ featured: null }) });
  }

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Danh mục sản phẩm</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Tìm lựa chọn phù hợp</h1>
        </div>
        <p className="text-sm text-muted">
          {result ? `${result.pagination.total} sản phẩm` : "Đang cập nhật danh sách"}
        </p>
      </div>

      <form onSubmit={onSearchSubmit} className="mb-6 flex flex-wrap gap-2 rounded-card border border-line bg-surface p-2 shadow-card">
        <div className="min-w-0 flex-1 basis-64">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tên sản phẩm, mô tả hoặc SKU"
            aria-label="Tìm trong danh sách sản phẩm"
            icon={<PackageSearch className="h-4 w-4" aria-hidden />}
            className="border-transparent bg-subtle"
          />
        </div>
        <Button type="submit" variant="secondary">
          Tìm kiếm
        </Button>
        <Button
          type="button"
          variant="outline"
          className="lg:hidden"
          onClick={() => setMobileFiltersOpen(true)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="mobile-product-filters"
        >
          <Filter className="h-4 w-4" aria-hidden />
          Lọc
          {activeFilterCount > 0 && <Badge tone="accent">{activeFilterCount}</Badge>}
        </Button>
      </form>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-10">
        <aside
          aria-label="Bộ lọc sản phẩm"
          className="hidden self-start rounded-card border border-line bg-surface p-5 shadow-card lg:sticky lg:top-32 lg:block lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto"
        >
          <FilterPanel
            categories={categories}
            brands={brands}
            params={params}
            activeCount={activeFilterCount}
            onChange={patch}
            onClear={clearFilters}
          />
        </aside>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Đóng bộ lọc"
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-ink/45"
            />
            <aside
              id="mobile-product-filters"
              role="dialog"
              aria-modal="true"
              aria-label="Bộ lọc sản phẩm"
              className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col border-l border-line bg-surface shadow-pop"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <SlidersHorizontal className="h-5 w-5 text-accent" aria-hidden />
                  Lọc sản phẩm
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Đóng bộ lọc"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FilterPanel
                  categories={categories}
                  brands={brands}
                  params={params}
                  activeCount={activeFilterCount}
                  onChange={patch}
                  onClear={clearFilters}
                />
              </div>
              <div className="border-t border-line bg-surface p-4">
                <Button className="w-full" onClick={() => setMobileFiltersOpen(false)}>
                  Xem {result?.pagination.total ?? ""} kết quả
                </Button>
              </div>
            </aside>
          </div>
        )}

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-h-8 flex-wrap items-center gap-2">
              {filterChips.length > 0 ? (
                filterChips.map((chip) => (
                  <FilterChip key={chip.key} label={chip.label} onRemove={chip.clear} />
                ))
              ) : (
                <span className="text-sm text-muted">Không có bộ lọc đang áp dụng</span>
              )}
            </div>

            <Select
              value={sort}
              onChange={(event) => patch({ sort: event.target.value })}
              className="w-full shrink-0 sm:w-auto"
              aria-label="Sắp xếp sản phẩm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {error && <ErrorState message={error} onRetry={load} />}
          {!error && loading && <ProductGridSkeleton count={12} />}

          {!error && !loading && items.length === 0 && (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              description="Hãy thử từ khóa khác hoặc xóa bớt bộ lọc."
              action={
                <Button variant="outline" onClick={resetEverything}>
                  Xóa tìm kiếm và bộ lọc
                </Button>
              }
            />
          )}

          {!error && !loading && items.length > 0 && (
            <>
              <ProductGrid items={items} />
              {result && <Pagination meta={result.pagination} onPageChange={onPageChange} className="mt-12" />}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
