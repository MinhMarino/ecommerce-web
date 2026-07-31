import { Heart, ImageOff, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { StarRating } from "../../components/ui/StarRating";
import { cn, discountPercent, formatCurrency } from "../../lib/utils";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image?: string | null;
  isFlashSale?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  soldCount?: number;
};

export function ProductCard({
  product,
  onToggleWishlist,
  wished = false,
  className,
}: {
  product: ProductCardData;
  onToggleWishlist?: (product: ProductCardData) => void;
  wished?: boolean;
  className?: string;
}) {
  const hasSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.price;
  const displayPrice = hasSale ? product.salePrice : product.price;
  const discount = discountPercent(product.price, hasSale ? product.salePrice : null);
  const hasRating = typeof product.ratingAverage === "number" && product.ratingAverage > 0;
  const hasSoldCount = typeof product.soldCount === "number" && product.soldCount > 0;

  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-subtle">
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1.5">
          {product.isFlashSale && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-canvas">
              <Zap className="h-3 w-3 fill-accent text-accent" aria-hidden />
              Flash sale
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-ink">
              -{discount}%
            </span>
          )}
        </div>

        {onToggleWishlist && (
          <button
            type="button"
            aria-label={wished ? `Bỏ ${product.name} khỏi yêu thích` : `Thêm ${product.name} vào yêu thích`}
            aria-pressed={wished}
            title={wished ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
            onClick={() => onToggleWishlist(product)}
            className="absolute right-2.5 top-2.5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/95 text-muted shadow-card hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Heart className={cn("h-4 w-4", wished && "fill-accent text-accent")} aria-hidden />
          </button>
        )}

        <Link
          to={`/products/${product.slug}`}
          aria-label={`Xem ${product.name}`}
          className="block aspect-square p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:p-5"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.035]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <ImageOff className="h-8 w-8" aria-hidden />
              <span className="sr-only">Chưa có ảnh sản phẩm</span>
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link
          to={`/products/${product.slug}`}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-bold tracking-tight text-ink sm:text-lg">
            {formatCurrency(displayPrice)}
          </span>
          {hasSale && (
            <span className="text-xs text-muted line-through">{formatCurrency(product.price)}</span>
          )}
        </div>

        {(hasRating || hasSoldCount) && (
          <div className="mt-auto flex min-h-8 items-end justify-between gap-2 pt-3">
            {hasRating ? (
              <StarRating value={product.ratingAverage ?? 0} count={product.ratingCount} />
            ) : (
              <span />
            )}
            {hasSoldCount && (
              <span className="shrink-0 text-[11px] text-muted">Đã bán {product.soldCount}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({
  items,
  emptyMessage = "Chưa có sản phẩm.",
  onToggleWishlist,
  wishedIds,
}: {
  items: ProductCardData[];
  emptyMessage?: string;
  onToggleWishlist?: (product: ProductCardData) => void;
  wishedIds?: Set<string>;
}) {
  if (!items.length) {
    return (
      <div className="rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-5">
      {items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onToggleWishlist={onToggleWishlist}
          wished={wishedIds?.has(product.id)}
        />
      ))}
    </div>
  );
}
