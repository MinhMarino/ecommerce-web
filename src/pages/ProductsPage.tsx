import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  images?: { url: string }[];
};

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "newest");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ name: string; slug: string }[]>([]);

  async function load() {
    setError(null);
    const qs = new URLSearchParams(params);
    qs.set("sort", sort);
    try {
      const data = await api<{ items: Product[] }>(`/api/v1/products?${qs.toString()}`, {
        auth: false,
      });
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải sản phẩm");
    }
  }

  useEffect(() => {
    void load();
  }, [params, sort]);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api<{ suggestions: { name: string; slug: string }[] }>(
        `/api/v1/search/suggest?q=${encodeURIComponent(q)}`,
        { auth: false },
      )
        .then((d) => setSuggestions(d.suggestions || []))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    setParams(next);
  }

  return (
    <div className="container section">
      <h1>Sản phẩm</h1>
      <form onSubmit={onSearch} style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm..." />
          <select className="input" style={{ maxWidth: 180 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="bestseller">Bán chạy</option>
            <option value="popular">Phổ biến</option>
            <option value="price_asc">Giá tăng</option>
            <option value="price_desc">Giá giảm</option>
          </select>
          <button className="btn" type="submit">
            Tìm
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="banner">
            Gợi ý:{" "}
            {suggestions.map((s) => (
              <Link key={s.slug} to={`/products/${s.slug}`} style={{ marginRight: 8 }}>
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </form>
      {error ? <div className="banner error">{error}</div> : null}
      <div className="card-grid">
        {items.map((p) => (
          <Link key={p.id} to={`/products/${p.slug}`} className="product-card">
            <div className="thumb">
              {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.name} /> : <span>{p.name[0]}</span>}
            </div>
            <div className="body">
              <strong>{p.name}</strong>
              <div className="price">
                {(p.salePrice ?? p.price).toLocaleString("vi-VN")}đ
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!items.length && !error ? <p style={{ color: "var(--muted)" }}>Không có sản phẩm phù hợp</p> : null}
    </div>
  );
}
