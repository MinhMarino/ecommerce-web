import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import {
  ORDER_STATUS_LABEL,
  orderLabel,
  orderTone,
  paymentLabel,
  paymentTone,
  PAYMENT_METHOD_LABEL,
} from "../../lib/status";
import type { OrderDetail } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { ErrorState } from "../../components/ui/EmptyState";
import { PageSpinner } from "../../components/ui/Spinner";

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const data = await api<OrderDetail>(`/api/v1/orders/${id}`);
      setOrder(data);
      setNextStatus(data.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được đơn hàng");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus() {
    if (!id || !order || nextStatus === order.status) return;
    setUpdating(true);
    try {
      await api(`/api/v1/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "update_status", status: nextStatus }),
      });
      toast.success("Đã cập nhật trạng thái đơn hàng");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không cập nhật được trạng thái");
    } finally {
      setUpdating(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <PageSpinner label="Đang tải đơn hàng..." />;

  const address = [order.shipLine1, order.shipWard, order.shipDistrict, order.shipCity].filter(Boolean).join(", ");

  return (
    <div>
      <Link to="/admin/orders" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách đơn hàng
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Đơn hàng {order.orderNumber}</h1>
          <p className="text-sm text-muted">
            Khách hàng đặt ngày {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={orderTone(order.status)}>{orderLabel(order.status)}</Badge>
          <Badge tone={paymentTone(order.paymentStatus)}>{paymentLabel(order.paymentStatus)}</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-semibold">Cập nhật trạng thái</h2>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-48">
                <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <Button onClick={updateStatus} isLoading={updating} disabled={nextStatus === order.status}>
                Lưu trạng thái
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Lịch sử trạng thái</h2>
            <ol className="mt-4 space-y-4">
              {order.statusHistory.map((h, i) => (
                <li key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={
                        i === order.statusHistory.length - 1
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-ink"
                          : "flex h-6 w-6 items-center justify-center rounded-full bg-ok/15 text-ok"
                      }
                    >
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
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-white">
                    {i.imageUrl && <img src={i.imageUrl} alt={i.name} className="h-full w-full object-contain" />}
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

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4.5 w-4.5 text-accent" /> Địa chỉ giao hàng
            </h2>
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
        </div>
      </div>
    </div>
  );
}
