import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useApp } from "../lib/store";

type Cart = {
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    slug: string;
  }[];
  subtotal: number;
};

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();

  async function load() {
    try {
      setCart(await api<Cart>("/api/v1/cart"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi giỏ hàng");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateQty(itemId: string, quantity: number) {
    await api("/api/v1/cart", {
      method: "PATCH",
      body: JSON.stringify({ itemId, quantity }),
    });
    await load();
  }

  if (error) return <div className="container section"><div className="banner error">{error}</div></div>;
  if (!cart) return <div className="container section">Đang tải giỏ hàng...</div>;

  return (
    <div className="container section">
      <h1>Giỏ hàng</h1>
      {!cart.items.length ? (
        <p>
          Giỏ trống. <Link to="/products">Mua sắm ngay</Link>
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.8rem" }}>
          {cart.items.map((item) => (
            <div key={item.id} className="product-card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <Link to={`/products/${item.slug}`}>
                  <strong>{item.name}</strong>
                </Link>
                <div>{item.unitPrice.toLocaleString("vi-VN")}đ</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn secondary" type="button" onClick={() => updateQty(item.id, item.quantity - 1)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button className="btn secondary" type="button" onClick={() => updateQty(item.id, item.quantity + 1)}>
                  +
                </button>
                <strong>{item.lineTotal.toLocaleString("vi-VN")}đ</strong>
              </div>
            </div>
          ))}
          <h3>Tạm tính: {cart.subtotal.toLocaleString("vi-VN")}đ</h3>
          {user ? (
            <Link className="btn" to="/checkout">
              Thanh toán
            </Link>
          ) : (
            <Link className="btn" to="/login">
              Đăng nhập để thanh toán
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const nav = useNavigate();
  const [methods, setMethods] = useState<{ id: string; name: string; fee: number }[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "Hồ Chí Minh",
    shippingMethodId: "",
    paymentMethod: "COD",
    couponCode: "",
    note: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ items: { id: string; name: string; fee: number }[] }>("/api/v1/shipping-methods", { auth: false })
      .then((d) => {
        setMethods(d.items);
        if (d.items[0]) setForm((f) => ({ ...f, shippingMethodId: d.items[0].id }));
      })
      .catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const order = await api<{ id: string; orderNumber: string }>("/api/v1/checkout", {
        method: "POST",
        body: JSON.stringify({
          shipping: {
            fullName: form.fullName,
            phone: form.phone,
            line1: form.line1,
            city: form.city,
            country: "VN",
          },
          shippingMethodId: form.shippingMethodId,
          paymentMethod: form.paymentMethod,
          couponCode: form.couponCode || undefined,
          note: form.note || undefined,
        }),
      });
      nav(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout thất bại");
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <h1>Thanh toán</h1>
      {error ? <div className="banner error">{error}</div> : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.7rem" }}>
        <input className="input" required placeholder="Người nhận" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="input" required placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" required placeholder="Địa chỉ" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
        <input className="input" required placeholder="Thành phố" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <select className="input" value={form.shippingMethodId} onChange={(e) => setForm({ ...form, shippingMethodId: e.target.value })}>
          {methods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.fee.toLocaleString("vi-VN")}đ
            </option>
          ))}
        </select>
        <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
          <option value="COD">COD</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="CARD">Thẻ</option>
          <option value="EWALLET">Ví điện tử</option>
        </select>
        <input className="input" placeholder="Mã giảm giá" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} />
        <textarea className="input" placeholder="Ghi chú" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button className="btn" type="submit">
          Xác nhận đơn hàng
        </button>
      </form>
    </div>
  );
}

export function AccountPage() {
  const { user } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    api<{ items: any[] }>("/api/v1/orders").then((d) => setOrders(d.items)).catch(() => undefined);
    api<{ items: any[] }>("/api/v1/wishlist").then((d) => setWishlist(d.items)).catch(() => undefined);
  }, [user]);

  if (!user) return <div className="container section">Vui lòng <Link to="/login">đăng nhập</Link></div>;

  return (
    <div className="container section">
      <h1>Tài khoản</h1>
      <p>
        {user.fullName} · {user.email} · {user.role}
      </p>
      <h2>Đơn hàng</h2>
      <div style={{ display: "grid", gap: 8 }}>
        {orders.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="product-card" style={{ padding: 12 }}>
            <strong>{o.orderNumber}</strong> — {o.status} — {(o.total ?? 0).toLocaleString("vi-VN")}đ
          </Link>
        ))}
        {!orders.length && <p style={{ color: "var(--muted)" }}>Chưa có đơn hàng</p>}
      </div>
      <h2>Yêu thích</h2>
      <div className="card-grid">
        {wishlist.map((w) => (
          <Link key={w.id} to={`/products/${w.slug}`} className="product-card">
            <div className="body">
              <strong>{w.name}</strong>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const id = window.location.pathname.split("/").pop();
  const [order, setOrder] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api(`/api/v1/orders/${id}`).then(setOrder).catch((e) => setMsg(e.message));
  }, [id]);

  async function cancel() {
    if (!id) return;
    await api(`/api/v1/orders/${id}`, { method: "PATCH", body: JSON.stringify({ action: "cancel" }) });
    setMsg("Đã hủy đơn");
    setOrder(await api(`/api/v1/orders/${id}`));
  }

  if (!order) return <div className="container section">{msg || "Đang tải đơn..."}</div>;

  return (
    <div className="container section">
      <h1>Đơn {order.orderNumber}</h1>
      <p>
        Trạng thái: <strong>{order.status}</strong> · Thanh toán: {order.paymentStatus}
      </p>
      <p>Tổng: {(order.total ?? 0).toLocaleString("vi-VN")}đ</p>
      <ul>
        {order.items?.map((i: any) => (
          <li key={i.id}>
            {i.name} x{i.quantity}
          </li>
        ))}
      </ul>
      {["PENDING_CONFIRMATION", "CONFIRMED"].includes(order.status) ? (
        <button className="btn secondary" type="button" onClick={cancel}>
          Hủy đơn
        </button>
      ) : null}
      {msg ? <p>{msg}</p> : null}
    </div>
  );
}
