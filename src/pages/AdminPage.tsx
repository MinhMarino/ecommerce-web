import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
  PackagePlus,
  ShoppingBag,
  Users,
} from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { useToast } from "../lib/toast";
import { formatCurrency, formatDateTime } from "../lib/utils";
import { orderLabel, orderTone, PRODUCT_STATUS_LABEL } from "../lib/status";
import type { DashboardData } from "../lib/types";
import { Container } from "../components/ui/Container";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { ErrorState } from "../components/ui/EmptyState";
import { PageSpinner } from "../components/ui/Spinner";
import { SalesChart } from "../components/admin/SalesChart";

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof BadgeDollarSign;
  tone: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

const emptyForm = {
  name: "",
  price: "",
  salePrice: "",
  stock: "10",
  sku: "",
  status: "ACTIVE",
  imageUrl: "",
  description: "",
};

export function AdminPage() {
  const { user } = useApp();
  const toast = useToast();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setDash(await api<DashboardData>("/api/v1/admin/dashboard"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dashboard");
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "STAFF") void load();
  }, [user]);

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api("/api/v1/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          salePrice: form.salePrice ? Number(form.salePrice) : undefined,
          stock: Number(form.stock),
          sku: form.sku || undefined,
          status: form.status,
          description: form.description || undefined,
          images: form.imageUrl ? [{ url: form.imageUrl }] : [],
        }),
      });
      toast.success("Đã tạo sản phẩm mới");
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tạo sản phẩm thất bại");
    } finally {
      setCreating(false);
    }
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return (
      <Container className="py-16">
        <ErrorState message="Bạn không có quyền truy cập trang quản trị." />
        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Đăng nhập bằng tài khoản quản trị
          </Link>
        </p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16">
        <ErrorState message={error} onRetry={load} />
      </Container>
    );
  }

  if (!dash) return <PageSpinner label="Đang tải trang quản trị..." />;

  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Bảng điều khiển</h1>
        <p className="text-sm text-muted">Xin chào {user.fullName}, đây là tổng quan hệ thống của bạn.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Doanh thu" value={formatCurrency(dash.kpis.revenue)} icon={BadgeDollarSign} tone="bg-ok/10 text-ok" />
        <KpiCard label="Đơn hàng" value={String(dash.kpis.orders)} icon={ShoppingBag} tone="bg-info/10 text-info" />
        <KpiCard label="Khách hàng" value={String(dash.kpis.customers)} icon={Users} tone="bg-accent/10 text-accent" />
        <KpiCard label="Sản phẩm" value={String(dash.kpis.products)} icon={Boxes} tone="bg-warning/10 text-warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold">Doanh số 30 ngày qua</h2>
          </CardHeader>
          <CardBody>
            <SalesChart data={dash.salesByDay} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4.5 w-4.5 text-warning" /> Tồn kho thấp
            </h2>
          </CardHeader>
          <CardBody className="max-h-72 space-y-2.5 overflow-y-auto">
            {dash.lowStock.length ? (
              dash.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="line-clamp-1">{p.name}</span>
                  <Badge tone={p.stock === 0 ? "danger" : "warning"}>còn {p.stock}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Không có cảnh báo tồn kho.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold">Đơn hàng gần đây</h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Mã đơn</th>
                <th className="px-5 py-3">Khách hàng</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Ngày tạo</th>
                <th className="px-5 py-3 text-right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dash.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-5 py-3 text-muted">{o.user.fullName}</td>
                  <td className="px-5 py-3">
                    <Badge tone={orderTone(o.status)}>{orderLabel(o.status)}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(o.total)}</td>
                </tr>
              ))}
              {!dash.recentOrders.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="flex items-center gap-2 font-semibold">
            <PackagePlus className="h-4.5 w-4.5 text-accent" /> Thêm sản phẩm mới
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={createProduct} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="p-name">Tên sản phẩm</Label>
              <Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-price">Giá bán</Label>
              <Input id="p-price" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-sale">Giá khuyến mãi (không bắt buộc)</Label>
              <Input id="p-sale" type="number" min={0} value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-stock">Tồn kho</Label>
              <Input id="p-stock" type="number" min={0} required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-sku">SKU</Label>
              <Input id="p-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-image">URL hình ảnh</Label>
              <Input id="p-image" type="url" placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-status">Trạng thái</Label>
              <Select id="p-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(PRODUCT_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2 flex items-end">
              <Button type="submit" isLoading={creating} className="w-full sm:w-auto">
                Tạo sản phẩm
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
}
