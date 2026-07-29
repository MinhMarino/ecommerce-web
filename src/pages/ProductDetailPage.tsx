import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  Heart,
  ImageOff,
  MessageCircleQuestion,
  ShieldCheck,
  Truck,
  Undo2,
} from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { useToast } from "../lib/toast";
import { cn, discountPercent, formatCurrency, formatDate } from "../lib/utils";
import type { ProductDetail } from "../lib/types";
import { Container } from "../components/ui/Container";
import { PageSpinner } from "../components/ui/Spinner";
import { ErrorState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { StarRating } from "../components/ui/StarRating";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { ProductGrid } from "../components/ProductCard";

function Gallery({ images, name }: { images: { url: string; alt?: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-card border border-line bg-white p-4">
        {current ? (
          <img src={current.url} alt={current.alt || name} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white transition-colors",
                i === active ? "border-accent" : "border-line hover:border-line-strong",
              )}
            >
              <img src={img.url} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const { user, refreshCartCount } = useApp();
  const toast = useToast();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishing, setWishing] = useState(false);
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setError(null);
    api<ProductDetail>(`/api/v1/products/${slug}`, { auth: false })
      .then((p) => {
        setProduct(p);
        setVariantId(p.variants[0]?.id ?? null);
        setQty(1);
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  const activeVariant = useMemo(
    () => product?.variants.find((v) => v.id === variantId) ?? null,
    [product, variantId],
  );

  const price = activeVariant?.salePrice ?? activeVariant?.price ?? product?.salePrice ?? product?.price ?? 0;
  const basePrice = activeVariant?.price ?? product?.price ?? 0;
  const stock = activeVariant?.stock ?? product?.stock ?? 0;
  const pct = discountPercent(basePrice, price < basePrice ? price : null);

  async function addToCart() {
    if (!product) return;
    setAdding(true);
    try {
      await api("/api/v1/cart", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, variantId, quantity: qty }),
      });
      toast.success("Đã thêm vào giỏ hàng");
      await refreshCartCount();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thêm được vào giỏ");
    } finally {
      setAdding(false);
    }
  }

  async function toggleWishlist() {
    if (!product) return;
    if (!user) {
      toast.info("Vui lòng đăng nhập để dùng danh sách yêu thích");
      return;
    }
    setWishing(true);
    try {
      if (wished) {
        await api("/api/v1/wishlist", { method: "DELETE", body: JSON.stringify({ productId: product.id }) });
        setWished(false);
        toast.success("Đã bỏ khỏi yêu thích");
      } else {
        await api("/api/v1/wishlist", { method: "POST", body: JSON.stringify({ productId: product.id }) });
        setWished(true);
        toast.success("Đã thêm vào yêu thích");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setWishing(false);
    }
  }

  if (error) {
    return (
      <Container className="py-12">
        <ErrorState message={error} />
      </Container>
    );
  }
  if (!product) return <PageSpinner label="Đang tải sản phẩm..." />;

  const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[];
  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs) : [];

  return (
    <Container className="py-8 sm:py-10">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted">
        <Link to="/" className="hover:text-accent">Trang chủ</Link> /
        <Link to="/products" className="hover:text-accent">Sản phẩm</Link>
        {product.category && (
          <>
            /
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-accent">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery images={product.images ?? []} name={product.name} />

        <div>
          {product.brand && <p className="text-sm font-medium text-accent">{product.brand.name}</p>}
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating value={product.ratingAverage} count={product.ratingCount} size="md" />
            <span className="text-sm text-muted">Đã bán {product.soldCount ?? 0}</span>
          </div>

          <div className="mt-4 rounded-card bg-accent/5 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-accent">{formatCurrency(price)}</span>
              {pct > 0 && (
                <>
                  <span className="text-base text-muted line-through">{formatCurrency(basePrice)}</span>
                  <Badge tone="danger">-{pct}%</Badge>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            {stock > 0 ? (
              <Badge tone="ok"><Check className="h-3 w-3" /> Còn {stock} sản phẩm</Badge>
            ) : (
              <Badge tone="danger">Hết hàng</Badge>
            )}
            {product.sku && <Badge tone="neutral">SKU: {product.sku}</Badge>}
          </div>

          {colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Màu sắc</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const variant = product.variants.find((v) => v.color === color && (!activeVariant?.size || v.size === activeVariant?.size)) ?? product.variants.find((v) => v.color === color);
                  const selected = activeVariant?.color === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => variant && setVariantId(variant.id)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                        selected ? "border-accent bg-accent/10 text-accent" : "border-line hover:border-line-strong",
                      )}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold">Kích thước</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const variant = product.variants.find((v) => v.size === size && (!activeVariant?.color || v.color === activeVariant?.color)) ?? product.variants.find((v) => v.size === size);
                  const selected = activeVariant?.size === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => variant && setVariantId(variant.id)}
                      className={cn(
                        "min-w-11 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        selected ? "border-accent bg-accent/10 text-accent" : "border-line hover:border-line-strong",
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={stock || undefined} />
            <Button size="lg" onClick={addToCart} isLoading={adding} disabled={stock <= 0} className="flex-1 sm:flex-none">
              {stock > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={toggleWishlist}
              isLoading={wishing}
              aria-label="Yêu thích"
            >
              <Heart className={cn("h-4.5 w-4.5", wished && "fill-accent text-accent")} />
            </Button>
          </div>

          <div className="mt-7 grid gap-3 rounded-card border border-line bg-subtle/50 p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" /> Giao COD toàn quốc
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Hàng chính hãng
            </div>
            <div className="flex items-center gap-2">
              <Undo2 className="h-4 w-4 text-accent" /> Đổi trả 7 ngày
            </div>
          </div>
        </div>
      </div>

      {/* Description & specs */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-lg font-bold">Mô tả sản phẩm</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
            {product.description || "Chưa có mô tả cho sản phẩm này."}
          </p>
        </div>
        {specs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold">Thông số kỹ thuật</h2>
            <dl className="mt-3 divide-y divide-line rounded-card border border-line">
              {specs.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                  <dt className="text-muted">{key}</dt>
                  <dd className="text-right font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Đánh giá ({product.ratingCount})
          </h2>
          <StarRating value={product.ratingAverage} size="md" />
        </div>
        <div className="mt-5 space-y-4">
          {product.reviews.length ? (
            product.reviews.map((r) => (
              <div key={r.id} className="rounded-card border border-line p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{r.user.fullName}</p>
                  <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
                <StarRating value={r.rating} className="mt-1" />
                {r.content && <p className="mt-2 text-sm text-muted">{r.content}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
          )}
        </div>
      </div>

      {/* Q&A */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageCircleQuestion className="h-5 w-5 text-accent" /> Hỏi đáp
        </h2>
        <div className="mt-5 space-y-4">
          {product.questions.length ? (
            product.questions.map((q) => (
              <div key={q.id} className="rounded-card border border-line p-4">
                <p className="text-sm font-medium">
                  <span className="text-accent">Hỏi:</span> {q.question}
                </p>
                {q.answer && (
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-medium text-ink">Đáp:</span> {q.answer}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">Chưa có câu hỏi nào.</p>
          )}
        </div>
      </div>

      {/* Related */}
      {product.related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Sản phẩm liên quan</h2>
          <ProductGrid
            items={product.related.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              salePrice: p.salePrice,
              image: p.images?.[0]?.url,
            }))}
          />
        </div>
      )}
    </Container>
  );
}
