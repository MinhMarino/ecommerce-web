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
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { formatCurrency } from "../lib/utils";
import type { Brand, Category, ProductSummary } from "../lib/types";
import { Container, Section, SectionHeading } from "../components/ui/Container";
import { ProductGrid } from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/EmptyState";
import { Button, ButtonLink } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { StarRating } from "../components/ui/StarRating";

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

function toCard(p: ProductSummary) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    salePrice: p.salePrice,
    image: p.images?.[0]?.url,
    isFlashSale: p.isFlashSale,
    soldCount: p.soldCount,
  };
}

const PERKS = [
  { icon: Truck, title: "Giao hàng toàn quốc", desc: "Thanh toán khi nhận hàng (COD)" },
  { icon: ShieldCheck, title: "Đảm bảo chất lượng", desc: "Cam kết hàng chính hãng 100%" },
  { icon: Undo2, title: "Đổi trả dễ dàng", desc: "Trong vòng 7 ngày kể từ khi nhận hàng" },
  { icon: Tag, title: "Ưu đãi mỗi ngày", desc: "Voucher và flash sale liên tục" },
];

export function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api<HomeData>("/api/v1/home", { auth: false })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  async function subscribe(e: FormEvent) {
    e.preventDefault();
    setSubLoading(true);
    try {
      await api("/api/v1/newsletter", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email }),
      });
      toast.success("Đăng ký nhận email thành công");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi đăng ký");
    } finally {
      setSubLoading(false);
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
        <div className="h-[280px] w-full bg-subtle" />
        <Container className="py-8">
          <ProductGridSkeleton />
        </Container>
      </div>
    );
  }

  const hero = data.banners[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--hero-grad)" }}>
        <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-14">
          <div className="max-w-xl text-white">
            <h1 className="text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-5xl">
              {hero?.title || "Mua sắm hiện đại, vận hành chuyên nghiệp"}
            </h1>
            <p className="mt-3 text-sm text-white/85 sm:text-base">
              Khám phá catalog sản phẩm được tuyển chọn, đặt hàng nhanh chóng và thanh toán khi nhận
              hàng — mọi thứ bạn cần trong một nền tảng.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink size="lg" to="/products" className="bg-white text-accent hover:bg-white/90">
                Khám phá sản phẩm <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                size="lg"
                to="/register"
                className="border border-white/50 bg-transparent text-white hover:bg-white/10"
              >
                Tạo tài khoản
              </ButtonLink>
            </div>
          </div>

          {hero?.imageUrl && (
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-card shadow-pop">
              <img src={hero.imageUrl} alt={hero.title} className="h-full w-full object-cover" />
            </div>
          )}
        </Container>
      </section>

      {/* Perks bar */}
      <Container className="-mt-px">
        <div className="grid grid-cols-2 gap-2.5 border-b border-line bg-surface px-1 py-3 sm:grid-cols-4 sm:py-4">
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex items-start gap-2">
              <perk.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-[13px] font-semibold leading-tight">{perk.title}</p>
                <p className="text-[11px] text-muted">{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Categories */}
      <Section className="!py-5">
        <Container>
          <SectionHeading title="Danh mục nổi bật" />
          {data.categories.length ? (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-8">
              {data.categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/products?category=${c.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-3 text-center transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-subtle text-base font-bold text-accent">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      c.name.slice(0, 1)
                    )}
                  </div>
                  <span className="line-clamp-2 text-[12px] font-medium leading-snug">{c.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có danh mục.</p>
          )}
        </Container>
      </Section>

      {/* Flash sale */}
      <Section className="!py-5">
        <Container>
          <div className="overflow-hidden rounded-card bg-gradient-to-r from-accent to-[#970010] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-lg font-extrabold text-white sm:text-xl">
                <Flame className="h-6 w-6 fill-warning text-warning" /> Flash Sale
              </span>
              <Link
                to="/products?flashSale=true"
                className="flex items-center gap-1 text-sm font-semibold text-white/90 hover:text-white"
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {data.flashSale.length ? (
              <div className="rounded-card bg-canvas p-3 sm:p-4">
                <ProductGrid items={data.flashSale.map(toCard)} />
              </div>
            ) : (
              <p className="rounded-card bg-white/10 px-4 py-6 text-center text-sm text-white/90">
                Hiện chưa có sản phẩm flash sale.
              </p>
            )}
          </div>
        </Container>
      </Section>

      {/* Featured */}
      <Section className="!py-5">
        <Container>
          <SectionHeading
            title="Sản phẩm nổi bật"
            action={
              <Link to="/products?featured=true" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ProductGrid items={data.featured.map(toCard)} emptyMessage="Chưa có sản phẩm nổi bật." />
        </Container>
      </Section>

      {/* Bestsellers */}
      <Section className="!py-5 bg-subtle/60">
        <Container>
          <SectionHeading
            title="Bán chạy nhất"
            action={
              <Link to="/products?sort=bestseller" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ProductGrid items={data.bestsellers.map(toCard)} emptyMessage="Chưa có dữ liệu bán chạy." />
        </Container>
      </Section>

      {/* Newest */}
      <Section className="!py-5">
        <Container>
          <SectionHeading
            title="Hàng mới về"
            action={
              <Link to="/products?sort=newest" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ProductGrid items={data.newest.map(toCard)} emptyMessage="Chưa có sản phẩm mới." />
        </Container>
      </Section>

      {/* Brands */}
      <Section className="!py-5 bg-subtle/60">
        <Container>
          <SectionHeading title="Thương hiệu" />
          {data.brands.length ? (
            <div className="flex flex-wrap gap-2.5">
              {data.brands.map((b) => (
                <Link
                  key={b.id}
                  to={`/products?brand=${b.slug}`}
                  className="flex items-center gap-2 rounded-md border border-line bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  {b.logoUrl && <img src={b.logoUrl} alt={b.name} className="h-5 w-5 rounded object-contain" />}
                  {b.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có thương hiệu.</p>
          )}
        </Container>
      </Section>

      {/* Coupons */}
      <Section className="!py-5">
        <Container>
          <SectionHeading title="Mã giảm giá" subtitle="Áp dụng ngay khi thanh toán" />
          {data.coupons.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.coupons.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-4 rounded-card border border-dashed border-accent/40 bg-accent/5 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-base font-bold tracking-wide">{c.code}</p>
                    <p className="text-sm text-muted">
                      Giảm {c.discountType === "PERCENT" ? `${c.value}%` : formatCurrency(c.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có voucher đang hiệu lực.</p>
          )}
        </Container>
      </Section>

      {/* Blog */}
      <Section className="!py-5 bg-subtle/60">
        <Container>
          <SectionHeading title="Tin tức & Bài viết" />
          {data.news.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.news.map((n) => (
                <div key={n.id} className="rounded-card border border-line bg-surface p-4">
                  <Newspaper className="h-5 w-5 text-accent" />
                  <h3 className="mt-2.5 text-sm font-semibold leading-snug">{n.title}</h3>
                  {n.excerpt && <p className="mt-1.5 line-clamp-3 text-sm text-muted">{n.excerpt}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có bài viết.</p>
          )}
        </Container>
      </Section>

      {/* Testimonials */}
      <Section className="!py-5">
        <Container>
          <SectionHeading title="Khách hàng nói gì" />
          {data.testimonials.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.testimonials.map((t) => (
                <div key={t.id} className="rounded-card border border-line bg-surface p-4">
                  <Quote className="h-5 w-5 text-accent/60" />
                  <p className="mt-2 text-sm leading-relaxed text-ink">{t.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{t.userName}</span>
                    <StarRating value={t.rating} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có đánh giá.</p>
          )}
        </Container>
      </Section>

      {/* Newsletter */}
      <Section className="bg-ink text-canvas">
        <Container className="flex flex-col items-center gap-3 text-center">
          <Mail className="h-7 w-7 text-accent" />
          <h2 className="text-xl font-bold sm:text-2xl">Đăng ký nhận bản tin</h2>
          <p className="max-w-md text-sm text-canvas/70">
            Nhận thông tin ưu đãi, sản phẩm mới và mã giảm giá độc quyền qua email.
          </p>
          <form onSubmit={subscribe} className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 text-canvas placeholder:text-canvas/50 border-white/20 focus:border-accent"
            />
            <Button type="submit" isLoading={subLoading} className="shrink-0">
              Đăng ký
            </Button>
          </form>
        </Container>
      </Section>
    </div>
  );
}
