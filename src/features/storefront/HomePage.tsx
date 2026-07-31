import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  Mail,
  Newspaper,
  Quote,
  ShieldCheck,
  Tag,
  Truck,
  Undo2,
} from "lucide-react";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Container, Section, SectionHeading } from "../../components/ui/Container";
import { ErrorState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { ProductGridSkeleton } from "../../components/ui/Skeleton";
import { StarRating } from "../../components/ui/StarRating";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import type { Brand, Category, ProductSummary } from "../../lib/types";
import { formatCurrency } from "../../lib/utils";
import { ProductGrid, type ProductCardData } from "./ProductCard";

type HomeData = {
  banners: { id: string; title: string; imageUrl: string; linkUrl?: string | null }[];
  categories: Category[];
  brands: Brand[];
  featured: ProductSummary[];
  bestsellers: ProductSummary[];
  newest: ProductSummary[];
  flashSale: ProductSummary[];
  coupons: { code: string; value: number; discountType: string; endsAt: string }[];
  news: { id: string; title: string; slug: string; excerpt?: string | null }[];
  testimonials: { id: string; rating: number; content?: string | null; userName: string }[];
  settings: Record<string, string>;
};

const PERKS = [
  { icon: Truck, title: "Giao hàng toàn quốc", description: "Hỗ trợ thanh toán COD" },
  { icon: ShieldCheck, title: "Chọn lọc chất lượng", description: "Thông tin sản phẩm rõ ràng" },
  { icon: Undo2, title: "Đổi trả thuận tiện", description: "Hỗ trợ trong 7 ngày" },
] as const;

function toCard(product: ProductSummary): ProductCardData {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    salePrice: product.salePrice,
    image: product.image ?? product.images?.[0]?.url,
    isFlashSale: product.isFlashSale,
    soldCount: product.soldCount,
    ratingCount: product.reviewCount,
  };
}

function Shelf({
  title,
  subtitle,
  to,
  products,
  emptyMessage,
  subdued = false,
}: {
  title: string;
  subtitle: string;
  to: string;
  products: ProductSummary[];
  emptyMessage: string;
  subdued?: boolean;
}) {
  return (
    <Section className={subdued ? "border-y border-line bg-subtle" : undefined}>
      <Container>
        <SectionHeading
          title={title}
          subtitle={subtitle}
          action={
            <Link
              to={to}
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Xem tất cả <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
          className="mb-6"
        />
        <ProductGrid items={products.map(toCard)} emptyMessage={emptyMessage} />
      </Container>
    </Section>
  );
}

export function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api<HomeData>("/api/v1/home", { auth: false })
      .then(setData)
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Không thể tải trang chủ");
      });
  }, []);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api("/api/v1/newsletter", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email }),
      });
      toast.success("Đăng ký nhận email thành công");
      setEmail("");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể đăng ký nhận tin");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <Container className="py-16">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </Container>
    );
  }

  if (!data) {
    return (
      <div>
        <div className="h-[360px] border-b border-line bg-surface surface-grid" />
        <Container className="py-12">
          <ProductGridSkeleton />
        </Container>
      </div>
    );
  }

  const hero = data.banners[0];

  return (
    <div className="bg-canvas">
      <section className="relative isolate overflow-hidden border-b border-line bg-surface surface-grid">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--ink) 10%, transparent) 0.65px, transparent 0.65px)",
            backgroundSize: "5px 5px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />

        <Container className="relative grid gap-10 py-14 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Bộ sưu tập tuyển chọn
            </p>
            <h1 className="max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
              {hero?.title || "Mua sắm ít nhiễu, chọn lựa dễ dàng."}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg">
              Khám phá sản phẩm nổi bật, mức giá minh bạch và trải nghiệm đặt hàng gọn gàng trên mọi thiết bị.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/products" size="lg">
                Khám phá sản phẩm <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/products?sort=bestseller" size="lg" variant="outline">
                Xem sản phẩm bán chạy
              </ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-card bg-accent/8 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-card border border-line bg-subtle p-3 shadow-pop sm:p-4">
              {hero?.imageUrl ? (
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-surface">
                  <img
                    src={hero.imageUrl}
                    alt={hero.title}
                    className="h-full w-full object-cover"
                    fetchPriority="high"
                  />
                </div>
              ) : (
                <div className="grid aspect-[4/3] grid-cols-2 gap-3 rounded-xl bg-surface p-4 sm:p-6">
                  {data.categories.slice(0, 4).map((category) => (
                    <div
                      key={category.id}
                      className="flex items-end rounded-xl border border-line bg-subtle p-3 text-sm font-semibold text-ink"
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid divide-y divide-line border-b border-line py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex items-center gap-3 px-2 py-4 sm:px-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <perk.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{perk.title}</p>
                <p className="mt-0.5 text-xs text-muted">{perk.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Section>
        <Container>
          <SectionHeading
            title="Khám phá theo danh mục"
            subtitle="Bắt đầu từ nhóm sản phẩm phù hợp với bạn"
            className="mb-6"
          />
          {data.categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {data.categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="group overflow-hidden rounded-card border border-line bg-surface p-3 shadow-card hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-subtle">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl font-bold text-accent">
                        {category.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 block line-clamp-2 text-sm font-semibold text-ink group-hover:text-accent">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-card border border-dashed border-line py-10 text-center text-sm text-muted">
              Chưa có danh mục để hiển thị.
            </p>
          )}
        </Container>
      </Section>

      <Shelf
        title="Sản phẩm nổi bật"
        subtitle="Những lựa chọn đáng chú ý trong tuần"
        to="/products?featured=true"
        products={data.featured}
        emptyMessage="Chưa có sản phẩm nổi bật."
      />

      <Shelf
        title="Được chọn nhiều"
        subtitle="Các sản phẩm đang bán chạy"
        to="/products?sort=bestseller"
        products={data.bestsellers}
        emptyMessage="Chưa có dữ liệu sản phẩm bán chạy."
        subdued
      />

      <Shelf
        title="Mới về"
        subtitle="Những sản phẩm vừa cập nhật"
        to="/products?sort=newest"
        products={data.newest}
        emptyMessage="Chưa có sản phẩm mới."
      />

      <Section className="border-y border-line bg-subtle">
        <Container className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
          <div className="overflow-hidden rounded-card bg-ink p-4 shadow-card sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 text-canvas">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold sm:text-xl">
                  <Flame className="h-5 w-5 fill-accent text-accent" aria-hidden />
                  Flash sale
                </p>
                <p className="mt-1 text-sm opacity-70">Ưu đãi nổi bật trong thời gian giới hạn</p>
              </div>
              <Link
                to="/products?flashSale=true"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover"
              >
                Xem thêm <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="rounded-xl bg-canvas p-3 sm:p-4">
              <ProductGrid
                items={data.flashSale.slice(0, 4).map(toCard)}
                emptyMessage="Hiện chưa có sản phẩm flash sale."
              />
            </div>
          </div>

          <aside className="rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-accent" aria-hidden />
              <h2 className="text-lg font-bold text-ink">Mã ưu đãi</h2>
            </div>
            <p className="mt-1 text-sm text-muted">Lưu mã và áp dụng khi thanh toán.</p>

            {data.coupons.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {data.coupons.slice(0, 3).map((coupon) => (
                  <div key={coupon.code} className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4">
                    <p className="font-mono text-sm font-bold tracking-wider text-ink">{coupon.code}</p>
                    <p className="mt-1 text-sm text-muted">
                      Giảm {coupon.discountType === "PERCENT" ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-subtle p-4 text-sm text-muted">Chưa có mã ưu đãi đang hiệu lực.</p>
            )}
          </aside>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title="Thương hiệu" subtitle="Tìm nhanh theo thương hiệu bạn quan tâm" className="mb-6" />
          {data.brands.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {data.brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brand=${brand.slug}`}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {brand.logoUrl && (
                    <img src={brand.logoUrl} alt="" loading="lazy" className="h-5 w-5 object-contain" />
                  )}
                  {brand.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có thương hiệu để hiển thị.</p>
          )}
        </Container>
      </Section>

      <Section className="border-t border-line bg-subtle">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title="Tin mới" subtitle="Gợi ý và cập nhật từ Mono" className="mb-5" />
            {data.news.length > 0 ? (
              <div className="grid gap-3">
                {data.news.slice(0, 3).map((article) => (
                  <article key={article.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
                    <div className="flex items-start gap-3">
                      <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                      <div>
                        <h3 className="text-sm font-semibold leading-6 text-ink">{article.title}</h3>
                        {article.excerpt && (
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{article.excerpt}</p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Chưa có bài viết mới.</p>
            )}
          </div>

          <div>
            <SectionHeading title="Khách hàng chia sẻ" subtitle="Trải nghiệm mua sắm thực tế" className="mb-5" />
            {data.testimonials.length > 0 ? (
              <div className="grid gap-3">
                {data.testimonials.slice(0, 3).map((testimonial) => (
                  <figure key={testimonial.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
                    <Quote className="h-5 w-5 text-accent" aria-hidden />
                    <blockquote className="mt-3 text-sm leading-6 text-muted">
                      {testimonial.content || "Trải nghiệm mua sắm thuận tiện và rõ ràng."}
                    </blockquote>
                    <figcaption className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink">{testimonial.userName}</span>
                      <StarRating value={testimonial.rating} />
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Chưa có chia sẻ từ khách hàng.</p>
            )}
          </div>
        </Container>
      </Section>

      <Section className="bg-ink text-canvas">
        <Container className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <Mail className="h-6 w-6 text-accent" aria-hidden />
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Nhận tin vừa đủ.</h2>
            <p className="mt-2 text-sm leading-6 opacity-70">
              Sản phẩm mới, ưu đãi đáng chú ý và không gửi thư rác.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-lg flex-col gap-2.5 sm:flex-row md:w-[460px]">
            <Input
              type="email"
              required
              autoComplete="email"
              aria-label="Địa chỉ email nhận bản tin"
              placeholder="email@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-canvas/20 bg-canvas text-ink placeholder:text-muted"
            />
            <Button type="submit" isLoading={submitting} className="shrink-0">
              Đăng ký
            </Button>
          </form>
        </Container>
      </Section>
    </div>
  );
}
