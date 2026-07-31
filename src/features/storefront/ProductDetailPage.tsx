import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Heart,
  ImageOff,
  MessageCircleQuestion,
  ShieldCheck,
  Truck,
  Undo2,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Container } from "../../components/ui/Container";
import { ErrorState } from "../../components/ui/EmptyState";
import { QuantityStepper } from "../../components/ui/QuantityStepper";
import { PageSpinner } from "../../components/ui/Spinner";
import { StarRating } from "../../components/ui/StarRating";
import { api } from "../../lib/api";
import { useApp } from "../../lib/store";
import { useToast } from "../../lib/toast";
import type { ProductDetail, ProductVariant } from "../../lib/types";
import { cn, discountPercent, formatCurrency, formatDate } from "../../lib/utils";
import { ProductGrid } from "./ProductCard";

function Gallery({ images, name }: { images: { url: string; alt?: string | null }[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div className="min-w-0">
      <div className="aspect-square overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card sm:p-8">
        {activeImage ? (
          <img
            src={activeImage.url}
            alt={activeImage.alt || name}
            className="h-full w-full object-contain"
            fetchPriority="high"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
            <ImageOff className="h-10 w-10" aria-hidden />
            <span className="text-sm">Chưa có ảnh sản phẩm</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar" aria-label="Ảnh sản phẩm">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Xem ảnh ${index + 1} của ${name}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "h-18 w-18 shrink-0 overflow-hidden rounded-xl border bg-surface p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                index === activeIndex ? "border-accent" : "border-line hover:border-line-strong",
              )}
            >
              <img src={image.url} alt="" loading="lazy" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantButton({
  variant,
  selected,
  onSelect,
}: {
  variant: ProductVariant;
  selected: boolean;
  onSelect: (variantId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(variant.id)}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        selected
          ? "border-accent bg-accent/10 text-accent"
          : "border-line bg-surface text-ink hover:border-line-strong",
        variant.stock <= 0 && "text-muted",
      )}
    >
      {variant.name}
      {variant.stock <= 0 && <span className="ml-1 text-xs font-normal">· Hết hàng</span>}
    </button>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const { user, refreshCartCount } = useApp();
  const toast = useToast();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishing, setWishing] = useState(false);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setProduct(null);
    setError(null);
    setWished(false);

    api<ProductDetail>(`/api/v1/products/${slug}`, { auth: false })
      .then((nextProduct) => {
        const initialVariant =
          nextProduct.variants.find((variant) => variant.stock > 0) ?? nextProduct.variants[0] ?? null;
        setProduct(nextProduct);
        setVariantId(initialVariant?.id ?? null);
        setQuantity(1);
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Không thể tải sản phẩm");
      });
  }, [slug]);

  const activeVariant = useMemo(
    () => product?.variants.find((variant) => variant.id === variantId) ?? null,
    [product, variantId],
  );

  const price = activeVariant?.salePrice ?? activeVariant?.price ?? product?.salePrice ?? product?.price ?? 0;
  const basePrice = activeVariant?.price ?? product?.price ?? 0;
  const stock = activeVariant?.stock ?? product?.stock ?? 0;
  const discount = discountPercent(basePrice, price < basePrice ? price : null);

  function selectVariant(nextVariantId: string) {
    setVariantId(nextVariantId);
    setQuantity(1);
  }

  async function addToCart() {
    if (!product || stock <= 0) return;
    setAdding(true);

    try {
      await api("/api/v1/cart", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, variantId, quantity }),
      });
      toast.success("Đã thêm sản phẩm vào giỏ hàng");
      await refreshCartCount();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể thêm vào giỏ hàng");
    } finally {
      setAdding(false);
    }
  }

  async function toggleWishlist() {
    if (!product) return;
    if (!user) {
      toast.info("Vui lòng đăng nhập để sử dụng danh sách yêu thích");
      return;
    }

    setWishing(true);
    try {
      if (wished) {
        await api("/api/v1/wishlist", {
          method: "DELETE",
          body: JSON.stringify({ productId: product.id }),
        });
        setWished(false);
        toast.success("Đã bỏ sản phẩm khỏi yêu thích");
      } else {
        await api("/api/v1/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: product.id }),
        });
        setWished(true);
        toast.success("Đã thêm sản phẩm vào yêu thích");
      }
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể cập nhật yêu thích");
    } finally {
      setWishing(false);
    }
  }

  if (error) {
    return (
      <Container className="py-16">
        <ErrorState message={error} />
      </Container>
    );
  }

  if (!product) return <PageSpinner label="Đang tải sản phẩm..." />;

  const colors = Array.from(
    new Set(product.variants.map((variant) => variant.color).filter((color): color is string => Boolean(color))),
  );
  const sizes = Array.from(
    new Set(product.variants.map((variant) => variant.size).filter((size): size is string => Boolean(size))),
  );
  const namedVariants = colors.length === 0 && sizes.length === 0 ? product.variants : [];
  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs) : [];
  const currentSku = activeVariant?.sku || product.sku;

  return (
    <Container className="py-6 sm:py-10">
      <nav aria-label="Đường dẫn" className="mb-6 flex items-center gap-1.5 overflow-x-auto text-sm text-muted no-scrollbar">
        <Link to="/" className="shrink-0 hover:text-accent">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <Link to="/products" className="shrink-0 hover:text-accent">Sản phẩm</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <Link
              to={`/products?category=${product.category.slug}`}
              className="shrink-0 hover:text-accent"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:gap-14">
        <Gallery key={product.id} images={product.images ?? []} name={product.name} />

        <div className="self-start lg:sticky lg:top-32">
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <Link
                to={`/products?brand=${product.brand.slug}`}
                className="text-xs font-bold uppercase tracking-[0.16em] text-accent hover:text-accent-hover"
              >
                {product.brand.name}
              </Link>
            )}
            {product.isFlashSale && <Badge tone="warning">Flash sale</Badge>}
          </div>

          <h1 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <StarRating value={product.ratingAverage} count={product.ratingCount} size="md" />
            <span className="text-sm text-muted">Đã bán {product.soldCount ?? 0}</span>
            {currentSku && <span className="text-sm text-muted">SKU: {currentSku}</span>}
          </div>

          <div className="mt-6 border-y border-line py-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {formatCurrency(price)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-base text-muted line-through">{formatCurrency(basePrice)}</span>
                  <Badge tone="accent">Tiết kiệm {discount}%</Badge>
                </>
              )}
            </div>
            <div className="mt-3">
              {stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ok">
                  <Check className="h-4 w-4" aria-hidden /> Còn {stock} sản phẩm
                </span>
              ) : (
                <span className="text-sm font-semibold text-danger">Tạm hết hàng</span>
              )}
            </div>
          </div>

          {colors.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-semibold text-ink">Màu sắc</legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const candidates = product.variants.filter((variant) => variant.color === color);
                  const matchingVariant =
                    candidates.find((variant) => variant.size === activeVariant?.size && variant.stock > 0) ??
                    candidates.find((variant) => variant.stock > 0) ??
                    candidates[0];
                  const selected = activeVariant?.color === color;

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => matchingVariant && selectVariant(matchingVariant.id)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        selected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-line bg-surface text-ink hover:border-line-strong",
                      )}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {sizes.length > 0 && (
            <fieldset className="mt-5">
              <legend className="mb-3 text-sm font-semibold text-ink">Kích thước</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const candidates = product.variants.filter((variant) => variant.size === size);
                  const matchingVariant =
                    candidates.find((variant) => variant.color === activeVariant?.color && variant.stock > 0) ??
                    candidates.find((variant) => variant.stock > 0) ??
                    candidates[0];
                  const selected = activeVariant?.size === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => matchingVariant && selectVariant(matchingVariant.id)}
                      aria-pressed={selected}
                      className={cn(
                        "min-w-12 rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        selected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-line bg-surface text-ink hover:border-line-strong",
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {namedVariants.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-semibold text-ink">Phiên bản</legend>
              <div className="flex flex-wrap gap-2">
                {namedVariants.map((variant) => (
                  <VariantButton
                    key={variant.id}
                    variant={variant}
                    selected={variant.id === variantId}
                    onSelect={selectVariant}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={stock > 0 ? stock : undefined}
              disabled={stock <= 0}
            />
            <Button
              size="lg"
              onClick={addToCart}
              isLoading={adding}
              disabled={stock <= 0}
              className="min-w-48 flex-1"
            >
              {stock > 0 ? "Thêm vào giỏ hàng" : "Tạm hết hàng"}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleWishlist}
              isLoading={wishing}
              aria-label={wished ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
              aria-pressed={wished}
              title={wished ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
              className="h-12 w-12"
            >
              <Heart className={cn("h-5 w-5", wished && "fill-accent text-accent")} aria-hidden />
            </Button>
          </div>

          <div className="mt-7 grid gap-3 rounded-card border border-line bg-subtle p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2 text-ink">
              <Truck className="h-4 w-4 shrink-0 text-accent" aria-hidden /> Giao COD toàn quốc
            </div>
            <div className="flex items-center gap-2 text-ink">
              <ShieldCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden /> Sản phẩm chọn lọc
            </div>
            <div className="flex items-center gap-2 text-ink">
              <Undo2 className="h-4 w-4 shrink-0 text-accent" aria-hidden /> Đổi trả 7 ngày
            </div>
          </div>
        </div>
      </div>

      <section className="mt-14 border-t border-line pt-10 sm:mt-18 sm:pt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Chi tiết</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Mô tả sản phẩm</h2>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted sm:text-base">
              {product.description || "Chưa có mô tả cho sản phẩm này."}
            </p>
          </div>

          {specs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-ink">Thông số kỹ thuật</h2>
              <dl className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
                {specs.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(100px,0.8fr)_1fr] gap-4 border-b border-line px-4 py-3 text-sm last:border-b-0">
                    <dt className="text-muted">{key}</dt>
                    <dd className="text-right font-medium text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      <section className="mt-14 border-t border-line pt-10 sm:pt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Phản hồi</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Đánh giá ({product.ratingCount})</h2>
          </div>
          <StarRating value={product.ratingAverage} count={product.ratingCount} size="md" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {product.reviews.length > 0 ? (
            product.reviews.map((review) => (
              <article key={review.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{review.user.fullName}</p>
                    <StarRating value={review.rating} className="mt-1.5" />
                  </div>
                  <time className="shrink-0 text-xs text-muted" dateTime={review.createdAt}>
                    {formatDate(review.createdAt)}
                  </time>
                </div>
                {review.content && <p className="mt-4 text-sm leading-6 text-muted">{review.content}</p>}
              </article>
            ))
          ) : (
            <p className="rounded-card border border-dashed border-line bg-surface px-6 py-10 text-center text-sm text-muted lg:col-span-2">
              Chưa có đánh giá cho sản phẩm này.
            </p>
          )}
        </div>
      </section>

      <section className="mt-14 border-t border-line pt-10 sm:pt-14">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <MessageCircleQuestion className="h-6 w-6 text-accent" aria-hidden />
          Hỏi đáp sản phẩm
        </h2>
        <div className="mt-6 grid gap-4">
          {product.questions.length > 0 ? (
            product.questions.map((question) => (
              <article key={question.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
                <p className="text-sm font-semibold leading-6 text-ink">
                  <span className="mr-2 text-accent">Hỏi</span>
                  {question.question}
                </p>
                {question.answer ? (
                  <p className="mt-3 border-l-2 border-accent pl-4 text-sm leading-6 text-muted">
                    <span className="mr-2 font-semibold text-ink">Mono trả lời</span>
                    {question.answer}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">Câu hỏi đang chờ phản hồi.</p>
                )}
              </article>
            ))
          ) : (
            <p className="rounded-card border border-dashed border-line bg-surface px-6 py-10 text-center text-sm text-muted">
              Chưa có câu hỏi nào cho sản phẩm này.
            </p>
          )}
        </div>
      </section>

      {product.related.length > 0 && (
        <section className="mt-14 border-t border-line pt-10 sm:pt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Khám phá thêm</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Sản phẩm liên quan</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-accent hover:text-accent-hover">
              Xem tất cả
            </Link>
          </div>
          <ProductGrid
            items={product.related.map((relatedProduct) => ({
              id: relatedProduct.id,
              name: relatedProduct.name,
              slug: relatedProduct.slug,
              price: relatedProduct.price,
              salePrice: relatedProduct.salePrice,
              image: relatedProduct.images?.[0]?.url,
              isFlashSale: relatedProduct.isFlashSale,
              soldCount: relatedProduct.soldCount,
              ratingCount: relatedProduct.reviewCount,
            }))}
          />
        </section>
      )}
    </Container>
  );
}
