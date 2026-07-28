import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useApp } from "../lib/store";

export function AdminPage() {
  const { user } = useApp();
  const [dash, setDash] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "10",
    status: "ACTIVE",
    imageUrl: "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      setDash(await api("/api/v1/admin/dashboard"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dashboard");
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "STAFF") void load();
  }, [user]);

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api("/api/v1/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          status: form.status,
          images: form.imageUrl ? [{ url: form.imageUrl }] : [],
        }),
      });
      setMsg("Đã tạo sản phẩm");
      setForm({ name: "", price: "", stock: "10", status: "ACTIVE", imageUrl: "" });
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Tạo thất bại");
    }
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return (
      <div className="container section">
        Không có quyền admin. <Link to="/login">Đăng nhập</Link>
      </div>
    );
  }

  if (error) return <div className="container section"><div className="banner error">{error}</div></div>;
  if (!dash) return <div className="container section">Đang tải admin...</div>;

  return (
    <div className="container section">
      <h1>Admin Dashboard</h1>
      <div className="card-grid">
        <div className="product-card"><div className="body"><strong>Doanh thu</strong><div>{(dash.kpis.revenue ?? 0).toLocaleString("vi-VN")}đ</div></div></div>
        <div className="product-card"><div className="body"><strong>Đơn hàng</strong><div>{dash.kpis.orders}</div></div></div>
        <div className="product-card"><div className="body"><strong>Khách hàng</strong><div>{dash.kpis.customers}</div></div></div>
        <div className="product-card"><div className="body"><strong>Sản phẩm</strong><div>{dash.kpis.products}</div></div></div>
      </div>

      <h2>Tồn kho thấp</h2>
      <ul>
        {dash.lowStock.map((p: any) => (
          <li key={p.id}>
            {p.name} — còn {p.stock}
          </li>
        ))}
        {!dash.lowStock.length && <li>Không có cảnh báo</li>}
      </ul>

      <h2>Đơn gần đây</h2>
      <ul>
        {dash.recentOrders.map((o: any) => (
          <li key={o.id}>
            {o.orderNumber} · {o.status} · {(o.total ?? 0).toLocaleString("vi-VN")}đ
          </li>
        ))}
      </ul>

      <h2>Thêm sản phẩm thật</h2>
      {msg ? <div className="banner">{msg}</div> : null}
      <form onSubmit={createProduct} style={{ display: "grid", gap: 8, maxWidth: 560 }}>
        <input className="input" required placeholder="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" required type="number" placeholder="Giá" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="input" required type="number" placeholder="Tồn kho" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input className="input" placeholder="URL hình ảnh" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DRAFT">DRAFT</option>
          <option value="HIDDEN">HIDDEN</option>
        </select>
        <button className="btn" type="submit">
          Tạo sản phẩm
        </button>
      </form>
    </div>
  );
}
