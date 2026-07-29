import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { api } from "../../lib/api";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { ORDER_STATUS_LABEL, orderLabel, orderTone } from "../../lib/status";
import type { AdminOrderListItem, Paginated } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { ErrorState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { TableRowSkeleton } from "../../components/ui/Skeleton";

export function AdminOrdersPage() {
  const [result, setResult] = useState<Paginated<AdminOrderListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (status) qs.set("status", status);
      if (q) qs.set("q", q);
      const data = await api<Paginated<AdminOrderListItem>>(`/api/v1/admin/orders?${qs.toString()}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(searchInput.trim());
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold sm:text-2xl">Đơn hàng</h1>
        <p className="text-sm text-muted">
          {result ? `${result.pagination.total} đơn hàng` : "Quản lý đơn hàng của khách"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm mã đơn, tên, email khách..."
            icon={<Search className="h-4 w-4" />}
            className="w-64"
          />
          <Button type="submit" variant="secondary">Tìm</Button>
        </form>
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="w-auto"
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}

                {!loading && result?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      Không có đơn hàng nào.
                    </td>
                  </tr>
                )}

                {!loading &&
                  result?.items.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.user.fullName}</p>
                        <p className="text-xs text-muted">{o.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={orderTone(o.status)}>{orderLabel(o.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          aria-label="Xem chi tiết đơn hàng"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {result && <Pagination meta={result.pagination} onPageChange={setPage} className="mt-6" />}
    </div>
  );
}
