import { Link } from "react-router-dom";
import { Flame, Heart, ImageOff } from "lucide-react";
import { cn, discountPercent, formatCurrency } from "../lib/utils";
import { Badge } from "./ui/Badge";

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
        "group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-pop",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-subtle">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {product.isFlashSale && (
            <Badge tone="danger" className="bg-danger text-white border-transparent">
              <Flame className="h-3 w-3" /> Flash sale
            </Badge>
          )}
          {pct > 0 && (
            <Badge tone="accent" className="bg-accent text-accent-ink border-transparent">
              -{pct}%
            </Badge>
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
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm backdrop-blur transition-colors hover:text-accent"
          >
            <Heart className={cn("h-4 w-4", wished && "fill-accent text-accent")} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-ink">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-1.5">
          <span className="font-serif text-base font-semibold text-accent">
            {formatCurrency(product.salePrice ?? product.price)}
          </span>
          {product.salePrice ? (
            <span className="text-xs text-muted line-through">
              {formatCurrency(product.price)}
            </span>
          ) : null}
        </div>
        {typeof product.soldCount === "number" && product.soldCount > 0 && (
          <p className="text-xs text-muted">Đã bán {product.soldCount}</p>
        )}
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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
