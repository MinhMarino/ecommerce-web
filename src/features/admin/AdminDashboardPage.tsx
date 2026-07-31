import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";
import { api } from "../../lib/api";
import { useApp } from "../../lib/store";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { orderLabel, orderTone } from "../../lib/status";
import type { DashboardData } from "../../lib/types";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/EmptyState";
import { PageSpinner } from "../../components/ui/Spinner";
import { SalesChart } from "./SalesChart";

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof BadgeDollarSign;
  tone: string;
}) {
  return (
    <Card className="group p-4 shadow-none transition-colors hover:border-line-strong sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">{value}</p>
          <p className="mt-1 text-xs text-muted">{helper}</p>
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function getProductSearchLink(product: DashboardData["lowStock"][number]) {
  const query = product.sku?.trim() || product.name;
  return `/admin/products?q=${encodeURIComponent(query)}`;
}

export function AdminDashboardPage() {
  const { user } = useApp();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      setDash(await api<DashboardData>("/api/v1/admin/dashboard"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dashboard");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!dash) return <PageSpinner label="Đang tải trang quản trị..." />;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section aria-labelledby="dashboard-heading" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Bảng điều khiển</p>
          <h1 id="dashboard-heading" className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Tổng quan vận hành
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Xin chào {user?.fullName ?? "quản trị viên"}, đây là dữ liệu mới nhất của cửa hàng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/admin/products?create=true" size="sm">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Thêm sản phẩm
          </ButtonLink>
          <ButtonLink to="/admin/orders" variant="outline" size="sm">
            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
            Xem đơn hàng
          </ButtonLink>
        </div>
      </section>

      <section aria-label="Chỉ số kinh doanh" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Doanh thu"
          value={formatCurrency(dash.kpis.revenue)}
          helper="Tổng giá trị ghi nhận"
          icon={BadgeDollarSign}
          tone="bg-ok/10 text-ok"
        />
        <KpiCard
          label="Đơn hàng"
          value={dash.kpis.orders.toLocaleString("vi-VN")}
          helper="Đơn trong hệ thống"
          icon={ShoppingBag}
          tone="bg-info/10 text-info"
        />
        <KpiCard
          label="Khách hàng"
          value={dash.kpis.customers.toLocaleString("vi-VN")}
          helper="Tài khoản khách hàng"
          icon={Users}
          tone="bg-accent/10 text-accent"
        />
        <KpiCard
          label="Sản phẩm"
          value={dash.kpis.products.toLocaleString("vi-VN")}
          helper="Sản phẩm trong danh mục"
          icon={Boxes}
          tone="bg-warning/10 text-warning"
        />
      </section>

      <section aria-label="Doanh số và tồn kho" className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="items-start">
            <div>
              <h2 className="font-semibold text-ink">Doanh số 30 ngày qua</h2>
              <p className="mt-0.5 text-xs text-muted">Doanh thu và số đơn theo từng ngày</p>
            </div>
          </CardHeader>
          <CardBody className="p-4 sm:p-5">
            <SalesChart data={dash.salesByDay} />
          </CardBody>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="items-start">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-ink">
                <AlertTriangle aria-hidden="true" className="h-4.5 w-4.5 text-warning" />
                Tồn kho thấp
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {dash.lowStock.length ? `${dash.lowStock.length} sản phẩm cần chú ý` : "Kho hàng đang ổn định"}
              </p>
            </div>
          </CardHeader>
          <CardBody className="max-h-[348px] space-y-2 overflow-y-auto p-3">
            {dash.lowStock.length ? (
              dash.lowStock.map((product) => (
                <Link
                  key={product.id}
                  to={getProductSearchLink(product)}
                  aria-label={`Tìm sản phẩm ${product.name} trong danh sách sản phẩm`}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 outline-none hover:border-line hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink group-hover:text-accent">{product.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">SKU: {product.sku || "Chưa có"}</p>
                  </div>
                  <Badge tone={product.stock === 0 ? "danger" : "warning"}>Còn {product.stock}</Badge>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              ))
            ) : (
              <div className="px-3 py-8 text-center">
                <Boxes aria-hidden="true" className="mx-auto h-7 w-7 text-ok" />
                <p className="mt-2 text-sm font-medium text-ink">Không có cảnh báo tồn kho</p>
                <p className="mt-1 text-xs text-muted">Tất cả sản phẩm đều còn đủ hàng.</p>
              </div>
            )}
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="recent-orders-heading">
        <Card className="overflow-hidden">
          <CardHeader className="items-start">
            <div>
              <h2 id="recent-orders-heading" className="font-semibold text-ink">Đơn hàng gần đây</h2>
              <p className="mt-0.5 text-xs text-muted">Theo dõi các đơn mới nhất cần xử lý</p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent outline-none hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent"
            >
              Xem tất cả
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </CardHeader>

          {dash.recentOrders.length ? (
            <>
              <div className="divide-y divide-line md:hidden">
                {dash.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/orders/${order.id}`}
                    className="block p-4 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{order.orderNumber}</p>
                        <p className="mt-0.5 truncate text-sm text-muted">{order.user.fullName}</p>
                      </div>
                      <Badge tone={orderTone(order.status)}>{orderLabel(order.status)}</Badge>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                      <p className="font-semibold text-ink">{formatCurrency(order.total)}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-subtle/45 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                      <th className="px-5 py-3">Mã đơn</th>
                      <th className="px-5 py-3">Khách hàng</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3">Ngày tạo</th>
                      <th className="px-5 py-3 text-right">Tổng tiền</th>
                      <th className="w-12 px-3 py-3"><span className="sr-only">Chi tiết</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {dash.recentOrders.map((order) => (
                      <tr key={order.id} className="group hover:bg-subtle/55">
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="font-semibold text-ink outline-none hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-ink">{order.user.fullName}</p>
                          <p className="mt-0.5 text-xs text-muted">{order.user.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={orderTone(order.status)}>{orderLabel(order.status)}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-muted">{formatDateTime(order.createdAt)}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-ink">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            aria-label={`Xem chi tiết đơn hàng ${order.orderNumber}`}
                            className="inline-grid h-8 w-8 place-items-center rounded-lg text-muted outline-none group-hover:text-accent hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            <ArrowRight aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-5 py-10 text-center">
              <ShoppingBag aria-hidden="true" className="mx-auto h-7 w-7 text-muted" />
              <p className="mt-2 text-sm font-medium text-ink">Chưa có đơn hàng nào</p>
              <p className="mt-1 text-xs text-muted">Đơn hàng mới sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
