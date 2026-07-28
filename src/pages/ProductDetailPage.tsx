import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

export function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api(`/api/v1/products/${slug}`, { auth: false })
      .then(setProduct)
      .catch((e) => setError(e.message));
  }, [slug]);

  async function addToCart() {
    try {
      await api("/api/v1/cart", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      setMsg("Đã thêm vào giỏ hàng");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Không thêm được");
    }
  }

  async function addWishlist() {
    try {
      await api("/api/v1/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId: product.id }),
      });
      setMsg("Đã thêm vào yêu thích");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Cần đăng nhập");
    }
  }

  if (error) return <div className="container section"><div className="banner error">{error}</div></div>;
  if (!product) return <div className="container section">Đang tải...</div>;

  return (
    <div className="container section" style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1.1fr 1fr" }}>
      <div className="product-card">
        <div className="thumb" style={{ aspectRatio: "1" }}>
          {product.images?.[0]?.url ? (
            <img src={product.images[0].url} alt={product.name} />
          ) : (
            <span>{product.name[0]}</span>
          )}
        </div>
      </div>
      <div>
        <h1 style={{ marginTop: 0 }}>{product.name}</h1>
        <p className="price" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
          {(product.salePrice ?? product.price).toLocaleString("vi-VN")}đ
        </p>
        <p style={{ color: "var(--muted)" }}>{product.description}</p>
        <p>Kho: {product.stock} · SKU: {product.sku || "—"}</p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={addToCart}>
            Thêm giỏ hàng
          </button>
          <button className="btn secondary" type="button" onClick={addWishlist}>
            Yêu thích
          </button>
        </div>
        {msg ? <p>{msg}</p> : null}
        {product.videoUrl ? (
          <p>
            <a href={product.videoUrl} target="_blank" rel="noreferrer">
              Xem video
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
