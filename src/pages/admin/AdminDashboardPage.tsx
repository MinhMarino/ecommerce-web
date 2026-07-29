import { useEffect, useState } from "react";
import { AlertTriangle, BadgeDollarSign, Boxes, ShoppingBag, Users } from "lucide-react";
import { api } from "../../lib/api";
import { useApp } from "../../lib/store";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { orderLabel, orderTone } from "../../lib/status";
import type { DashboardData } from "../../lib/types";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ErrorState } from "../../components/ui/EmptyState";
import { PageSpinner } from "../../components/ui/Spinner";
import { SalesChart } from "../../components/admin/SalesChart";

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
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
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
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold sm:text-2xl">Tổng quan</h1>
        <p className="text-sm text-muted">Xin chào {user?.fullName}, đây là tình hình kinh doanh hôm nay.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Doanh thu" value={formatCurrency(dash.kpis.revenue)} icon={BadgeDollarSign} tone="bg-ok/10 text-ok" />
        <KpiCard label="Đơn hàng" value={String(dash.kpis.orders)} icon={ShoppingBag} tone="bg-info/10 text-info" />
        <KpiCard label="Khách hàng" value={String(dash.kpis.customers)} icon={Users} tone="bg-accent/10 text-accent" />
        <KpiCard label="Sản phẩm" value={String(dash.kpis.products)} icon={Boxes} tone="bg-warning/10 text-warning" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
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

      <Card className="mt-4">
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
    </div>
  );
}
