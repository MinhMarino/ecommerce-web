import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type HomeData = {
  banners: { id: string; title: string; imageUrl: string; linkUrl?: string | null }[];
  categories: { id: string; name: string; slug: string; imageUrl?: string | null }[];
  brands: { id: string; name: string; slug: string; logoUrl?: string | null }[];
  featured: ProductCard[];
  bestsellers: ProductCard[];
  newest: ProductCard[];
  flashSale: ProductCard[];
  coupons: { code: string; value: number; discountType: string; endsAt: string }[];
  news: { id: string; title: string; slug: string; excerpt?: string | null }[];
  testimonials: { id: string; rating: number; content?: string | null; userName: string }[];
  settings: Record<string, string>;
};

type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image?: string | null;
};

function ProductGrid({ items }: { items: ProductCard[] }) {
  if (!items.length) {
    return <p style={{ color: "var(--muted)" }}>Chưa có sản phẩm. Admin hãy thêm sản phẩm thật.</p>;
  }
  return (
    <div className="card-grid">
      {items.map((p) => (
        <Link key={p.id} to={`/products/${p.slug}`} className="product-card">
          <div className="thumb">
            {p.image ? <img src={p.image} alt={p.name} /> : <span>{p.name.slice(0, 1)}</span>}
          </div>
          <div className="body">
            <strong>{p.name}</strong>
            <div className="price">
              {(p.salePrice ?? p.price).toLocaleString("vi-VN")}đ
              {p.salePrice ? <span className="old">{p.price.toLocaleString("vi-VN")}đ</span> : null}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subMsg, setSubMsg] = useState<string | null>(null);

  useEffect(() => {
    api<HomeData>("/api/v1/home", { auth: false })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  async function subscribe(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/v1/newsletter", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email }),
      });
      setSubMsg("Đăng ký nhận email thành công");
      setEmail("");
    } catch (err) {
      setSubMsg(err instanceof Error ? err.message : "Lỗi đăng ký");
    }
  }

  if (error) return <div className="container section"><div className="banner error">{error}</div></div>;
  if (!data) return <div className="container section">Đang tải trang chủ...</div>;

  const hero = data.banners[0];

  return (
    <div>
      <section style={{ background: "var(--hero-grad)", padding: "3rem 0 2rem" }}>
        <div className="container" style={{ display: "grid", gap: "1.2rem" }}>
          <p style={{ margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
            {data.settings.site_name || "Mono Commerce"}
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.2rem, 5vw, 3.6rem)", maxWidth: 720 }}>
            {hero?.title || data.settings.site_tagline || "Mua sắm hiện đại, vận hành chuyên nghiệp"}
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: 560 }}>
            Nền tảng bán hàng production-ready: catalog, giỏ hàng, thanh toán, đơn hàng và quản trị.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link className="btn" to="/products">
              Xem sản phẩm
            </Link>
            <Link className="btn secondary" to="/register">
              Tạo tài khoản
            </Link>
          </div>
        </div>
      </section>

      <section className="section container">
        <h2>Danh mục</h2>
        <p className="sub">Khám phá theo nhóm ngành hàng</p>
        <div className="card-grid">
          {data.categories.map((c) => (
            <Link key={c.id} to={`/products?category=${c.slug}`} className="product-card">
              <div className="body">
                <strong>{c.name}</strong>
              </div>
            </Link>
          ))}
          {!data.categories.length && <p style={{ color: "var(--muted)" }}>Chưa có danh mục</p>}
        </div>
      </section>

      <section className="section container">
        <h2>Flash Sale</h2>
        <p className="sub">Ưu đãi có thời hạn</p>
        <ProductGrid items={data.flashSale} />
      </section>

      <section className="section container">
        <h2>Nổi bật</h2>
        <p className="sub">Sản phẩm được chọn lọc</p>
        <ProductGrid items={data.featured} />
      </section>

      <section className="section container">
        <h2>Bán chạy</h2>
        <ProductGrid items={data.bestsellers} />
      </section>

      <section className="section container">
        <h2>Hàng mới</h2>
        <ProductGrid items={data.newest} />
      </section>

      <section className="section container">
        <h2>Thương hiệu</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {data.brands.map((b) => (
            <Link key={b.id} to={`/products?brand=${b.slug}`} className="btn secondary">
              {b.name}
            </Link>
          ))}
          {!data.brands.length && <p style={{ color: "var(--muted)" }}>Chưa có thương hiệu</p>}
        </div>
      </section>

      <section className="section container">
        <h2>Mã giảm giá</h2>
        <div className="card-grid">
          {data.coupons.map((c) => (
            <div key={c.code} className="product-card">
              <div className="body">
                <strong>{c.code}</strong>
                <span>
                  Giảm {c.discountType === "PERCENT" ? `${c.value}%` : `${c.value.toLocaleString("vi-VN")}đ`}
                </span>
              </div>
            </div>
          ))}
          {!data.coupons.length && <p style={{ color: "var(--muted)" }}>Chưa có voucher đang hiệu lực</p>}
        </div>
      </section>

      <section className="section container">
        <h2>Tin tức</h2>
        <div className="card-grid">
          {data.news.map((n) => (
            <div key={n.id} className="product-card">
              <div className="body">
                <strong>{n.title}</strong>
                <span style={{ color: "var(--muted)" }}>{n.excerpt}</span>
              </div>
            </div>
          ))}
          {!data.news.length && <p style={{ color: "var(--muted)" }}>Chưa có bài viết</p>}
        </div>
      </section>

      <section className="section container">
        <h2>Đánh giá khách hàng</h2>
        <div className="card-grid">
          {data.testimonials.map((t) => (
            <div key={t.id} className="product-card">
              <div className="body">
                <strong>{t.userName}</strong>
                <span>{"★".repeat(t.rating)}</span>
                <p style={{ margin: 0, color: "var(--muted)" }}>{t.content}</p>
              </div>
            </div>
          ))}
          {!data.testimonials.length && <p style={{ color: "var(--muted)" }}>Chưa có đánh giá</p>}
        </div>
      </section>

      <section className="section container">
        <h2>Đăng ký nhận email</h2>
        <form onSubmit={subscribe} style={{ display: "flex", gap: "0.6rem", maxWidth: 480 }}>
          <input
            className="input"
            type="email"
            required
            placeholder="email@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" type="submit">
            Đăng ký
          </button>
        </form>
        {subMsg ? <p>{subMsg}</p> : null}
      </section>
    </div>
  );
}
