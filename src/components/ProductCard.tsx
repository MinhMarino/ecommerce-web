import { Link } from "react-router-dom";
import { Heart, ImageOff, Zap } from "lucide-react";
import { cn, discountPercent, formatCurrency } from "../lib/utils";
import { StarRating } from "./ui/StarRating";

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
  wished,
  className,
}: {
  product: ProductCardData;
  onToggleWishlist?: (product: ProductCardData) => void;
  wished?: boolean;
  className?: string;
}) {
  const pct = discountPercent(product.price, product.salePrice);

  return (
    <Link
      to={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-shadow duration-150 hover:border-line-strong hover:shadow-pop",
        className,
      )}
    >
      <div className="absolute left-0 top-0 z-10 flex flex-col items-start">
        {product.isFlashSale && (
          <span className="flex items-center gap-0.5 rounded-br-md rounded-tl-card bg-ink px-2 py-1 text-[11px] font-bold text-white">
            <Zap className="h-3 w-3 fill-warning text-warning" /> Sale
          </span>
        )}
        {pct > 0 && (
          <span
            className={cn(
              "bg-accent px-2 py-1 text-[11px] font-bold text-accent-ink",
              product.isFlashSale ? "rounded-br-md" : "rounded-br-md rounded-tl-card",
            )}
          >
            -{pct}%
          </span>
        )}
      </div>

      {onToggleWishlist && (
        <button
          type="button"
          aria-label={wished ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-muted shadow-sm backdrop-blur transition-colors hover:text-accent"
        >
          <Heart className={cn("h-3.5 w-3.5", wished && "fill-accent text-accent")} />
        </button>
      )}

      <div className="relative aspect-square overflow-hidden bg-white p-3">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-line px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-medium leading-snug text-ink group-hover:text-accent">
          {product.name}
        </h3>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
          <span className="text-[15px] font-bold text-accent">
            {formatCurrency(product.salePrice ?? product.price)}
          </span>
        </div>
        {product.salePrice ? (
          <span className="text-xs text-muted line-through">
            {formatCurrency(product.price)}
          </span>
        ) : null}
        {(typeof product.ratingAverage === "number" && product.ratingAverage > 0) ||
        (typeof product.soldCount === "number" && product.soldCount > 0) ? (
          <div className="mt-1 flex items-center justify-between gap-1.5">
            {typeof product.ratingAverage === "number" && product.ratingAverage > 0 ? (
              <StarRating value={product.ratingAverage} />
            ) : (
              <span />
            )}
            {typeof product.soldCount === "number" && product.soldCount > 0 && (
              <span className="text-[11px] text-muted">Đã bán {product.soldCount}</span>
            )}
          </div>
        ) : null}
      </div>
    </Link>
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
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onToggleWishlist={onToggleWishlist}
          wished={wishedIds?.has(p.id)}
        />
      ))}
    </div>
  );
}
