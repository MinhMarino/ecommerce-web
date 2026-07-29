import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Heart,
  MapPin,
  Package,
  ShoppingBag,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { useToast } from "../lib/toast";
import { formatCurrency, formatDateTime } from "../lib/utils";
import { orderLabel, orderTone, paymentLabel, paymentTone, PAYMENT_METHOD_LABEL } from "../lib/status";
import type { Cart, OrderDetail, OrderListItem, ShippingMethod, WishlistItem } from "../lib/types";
import { Container } from "../components/ui/Container";
import { Button, ButtonLink } from "../components/ui/Button";
import { Input, Label, Textarea } from "../components/ui/Input";
import { QuantityStepper } from "../components/ui/QuantityStepper";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { PageSpinner } from "../components/ui/Spinner";
import { Skeleton } from "../components/ui/Skeleton";
import { ProductGrid } from "../components/ProductCard";

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const { user, refreshCartCount } = useApp();
  const toast = useToast();

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
    setBusyItem(itemId);
    try {
      await api("/api/v1/cart", { method: "PATCH", body: JSON.stringify({ itemId, quantity }) });
      await load();
      await refreshCartCount();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không cập nhật được");
    } finally {
      setBusyItem(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusyItem(itemId);
    try {
      await api("/api/v1/cart", { method: "DELETE", body: JSON.stringify({ itemId }) });
      await load();
      await refreshCartCount();
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xóa được");
    } finally {
      setBusyItem(null);
    }
  }

  if (error) {
    return (
      <Container className="py-12">
        <ErrorState message={error} onRetry={load} />
      </Container>
    );
  }
  if (!cart) return <PageSpinner label="Đang tải giỏ hàng..." />;

  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">Giỏ hàng</h1>

      {!cart.items.length ? (
        <EmptyState
          className="mt-8"
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Giỏ hàng của bạn đang trống"
          description="Khám phá sản phẩm và thêm vào giỏ hàng để tiếp tục."
          action={<ButtonLink to="/products">Mua sắm ngay</ButtonLink>}
        />
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {cart.items.map((item) => (
              <Card key={item.id} className="flex flex-wrap items-center gap-4 p-4">
                <Link to={`/products/${item.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-subtle">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </Link>
                <div className="min-w-[140px] flex-1">
                  <Link to={`/products/${item.slug}`} className="font-medium hover:text-accent">
                    {item.name}
                  </Link>
                  {item.variantName && <p className="text-xs text-muted">{item.variantName}</p>}
                  <p className="mt-1 text-sm font-semibold text-accent">{formatCurrency(item.unitPrice)}</p>
                </div>
                <QuantityStepper
                  value={item.quantity}
                  max={item.stock}
                  disabled={busyItem === item.id}
                  onChange={(next) => updateQty(item.id, next)}
                />
                <p className="w-28 text-right font-semibold">{formatCurrency(item.lineTotal)}</p>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={busyItem === item.id}
                  aria-label="Xóa sản phẩm"
                  className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5">
            <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính ({cart.itemCount} sản phẩm)</span>
                <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Phí vận chuyển</span>
                <span>Tính ở bước thanh toán</span>
              </div>
            </div>
            <div className="my-4 h-px bg-line" />
            <div className="flex justify-between text-base font-semibold">
              <span>Tổng cộng</span>
              <span className="text-accent">{formatCurrency(cart.subtotal)}</span>
            </div>
            {user ? (
              <ButtonLink to="/checkout" size="lg" className="mt-5 w-full">
                Tiến hành thanh toán
              </ButtonLink>
            ) : (
              <ButtonLink to="/login" size="lg" className="mt-5 w-full">
                Đăng nhập để thanh toán
              </ButtonLink>
            )}
          </Card>
        </div>
      )}
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export function CheckoutPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api<Cart>("/api/v1/cart"),
      api<{ items: ShippingMethod[] }>("/api/v1/shipping-methods", { auth: false }),
    ])
      .then(([cartData, methodsData]) => {
        setCart(cartData);
        setMethods(methodsData.items);
        if (methodsData.items[0]) setForm((f) => ({ ...f, shippingMethodId: methodsData.items[0].id }));
      })
      .catch((e) => setError(e.message));
  }, []);

  const selectedMethod = methods.find((m) => m.id === form.shippingMethodId);
  const shippingFee = selectedMethod?.fee ?? 0;
  const total = (cart?.subtotal ?? 0) + shippingFee;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
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
      toast.success("Đặt hàng thành công");
      nav(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !cart) {
    return (
      <Container className="py-12">
        <ErrorState message={error} />
      </Container>
    );
  }
  if (!cart) return <PageSpinner label="Đang tải thông tin thanh toán..." />;

  if (!cart.items.length) {
    return (
      <Container className="py-12">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Giỏ hàng trống"
          description="Bạn cần có sản phẩm trong giỏ hàng để thanh toán."
          action={<ButtonLink to="/products">Mua sắm ngay</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">Thanh toán</h1>

      <form onSubmit={onSubmit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {error && <ErrorState message={error} />}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold"><MapPin className="h-4.5 w-4.5 text-accent" /> Địa chỉ giao hàng</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line1">Địa chỉ</Label>
                <Input id="line1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="city">Thành phố</Label>
                <Input id="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Truck className="h-4.5 w-4.5 text-accent" /> Phương thức vận chuyển</h2>
            <div className="mt-4 space-y-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={form.shippingMethodId === m.id}
                      onChange={() => setForm({ ...form, shippingMethodId: m.id })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>
                      {m.name} <span className="text-muted">· {m.estimatedDays} ngày</span>
                    </span>
                  </span>
                  <span className="font-semibold">{formatCurrency(m.fee)}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Phương thức thanh toán</h2>
            <div className="mt-4 space-y-2">
              {[
                { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
                { value: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={form.paymentMethod === opt.value}
                    onChange={() => setForm({ ...form, paymentMethod: opt.value })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Ghi chú đơn hàng</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Mã giảm giá (nếu có)"
                value={form.couponCode}
                onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
              />
              <Textarea
                placeholder="Ghi chú cho người bán"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="sm:col-span-2 min-h-20"
              />
            </div>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="text-lg font-semibold">Đơn hàng của bạn</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-subtle">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="line-clamp-1 font-medium">{item.name}</p>
                  <p className="text-muted">SL: {item.quantity}</p>
                </div>
                <p className="font-medium">{formatCurrency(item.lineTotal)}</p>
              </div>
            ))}
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Tạm tính</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Phí vận chuyển</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="flex justify-between text-base font-semibold">
            <span>Tổng cộng</span>
            <span className="text-accent">{formatCurrency(total)}</span>
          </div>
          <Button type="submit" size="lg" isLoading={submitting} className="mt-5 w-full">
            Xác nhận đặt hàng
          </Button>
        </Card>
      </form>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export function AccountPage() {
  const { user } = useApp();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api<{ items: OrderListItem[] }>("/api/v1/orders").then((d) => setOrders(d.items)).catch(() => setOrders([]));
    api<{ items: WishlistItem[] }>("/api/v1/wishlist").then((d) => setWishlist(d.items)).catch(() => setWishlist([]));
  }, [user]);

  if (!user) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="Vui lòng đăng nhập"
          description="Đăng nhập để xem thông tin tài khoản, đơn hàng và danh sách yêu thích."
          action={<ButtonLink to="/login">Đăng nhập</ButtonLink>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-10">
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent">
          {user.fullName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{user.fullName}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <Badge tone="accent" className="ml-auto">{user.role}</Badge>
      </Card>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Đơn hàng của tôi</h2>
        {orders === null ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Chưa có đơn hàng nào"
            action={<ButtonLink to="/products">Mua sắm ngay</ButtonLink>}
          />
        ) : (
          <div className="space-y-2.5">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-accent"
              >
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-muted">{formatDateTime(o.createdAt)} · {o.itemCount} sản phẩm</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={orderTone(o.status)}>{orderLabel(o.status)}</Badge>
                  <span className="font-semibold text-accent">{formatCurrency(o.total)}</span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Sản phẩm yêu thích</h2>
        {wishlist === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState icon={<Heart className="h-6 w-6" />} title="Danh sách yêu thích trống" />
        ) : (
          <ProductGrid items={wishlist.map((w) => ({ id: w.id, name: w.name, slug: w.slug, price: w.price, salePrice: w.salePrice, image: w.image }))} />
        )}
      </div>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Order detail
// ---------------------------------------------------------------------------

export function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    if (!id) return;
    try {
      setOrder(await api<OrderDetail>(`/api/v1/orders/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được đơn hàng");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cancel() {
    if (!id) return;
    setCancelling(true);
    try {
      await api(`/api/v1/orders/${id}`, { method: "PATCH", body: JSON.stringify({ action: "cancel" }) });
      toast.success("Đã hủy đơn hàng");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không hủy được đơn hàng");
    } finally {
      setCancelling(false);
    }
  }

  if (error) {
    return (
      <Container className="py-12">
        <ErrorState message={error} onRetry={load} />
      </Container>
    );
  }
  if (!order) return <PageSpinner label="Đang tải đơn hàng..." />;

  const canCancel = ["PENDING_CONFIRMATION", "CONFIRMED"].includes(order.status);
  const address = [order.shipLine1, order.shipWard, order.shipDistrict, order.shipCity].filter(Boolean).join(", ");

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Đơn hàng {order.orderNumber}</h1>
          <p className="text-sm text-muted">Đặt ngày {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={orderTone(order.status)}>{orderLabel(order.status)}</Badge>
          <Badge tone={paymentTone(order.paymentStatus)}>{paymentLabel(order.paymentStatus)}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="p-5">
            <h2 className="font-semibold">Trạng thái đơn hàng</h2>
            <ol className="mt-4 space-y-4">
              {order.statusHistory.map((h, i) => (
                <li key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={i === order.statusHistory.length - 1 ? "flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-ink" : "flex h-6 w-6 items-center justify-center rounded-full bg-ok/15 text-ok"}>
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    {i < order.statusHistory.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-line" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold">{orderLabel(h.status)}</p>
                    <p className="text-xs text-muted">{formatDateTime(h.createdAt)}</p>
                    {h.note && <p className="mt-1 text-sm text-muted">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Sản phẩm ({order.items.length})</h2>
            <div className="mt-4 divide-y divide-line">
              {order.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-subtle">
                    {i.imageUrl && <img src={i.imageUrl} alt={i.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted">SL: {i.quantity} · {formatCurrency(i.price)}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(i.price * i.quantity)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold"><MapPin className="h-4.5 w-4.5 text-accent" /> Địa chỉ giao hàng</h2>
            <p className="mt-3 text-sm font-medium">{order.shipFullName}</p>
            <p className="text-sm text-muted">{order.shipPhone}</p>
            <p className="text-sm text-muted">{address}</p>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Thanh toán</h2>
            <p className="mt-3 text-sm">{PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Vận chuyển</span><span>{formatCurrency(order.shippingFee)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-muted">Giảm giá</span><span>-{formatCurrency(order.discount)}</span></div>}
              {order.tax > 0 && <div className="flex justify-between"><span className="text-muted">Thuế</span><span>{formatCurrency(order.tax)}</span></div>}
            </div>
            <div className="my-3 h-px bg-line" />
            <div className="flex justify-between font-semibold">
              <span>Tổng cộng</span>
              <span className="text-accent">{formatCurrency(order.total)}</span>
            </div>
          </Card>

          {canCancel && (
            <Button variant="outline" className="w-full" onClick={cancel} isLoading={cancelling}>
              Hủy đơn hàng
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
}
