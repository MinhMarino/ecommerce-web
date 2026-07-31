import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Pencil,
  Plus,
  Search,
  Tags,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";
import { FieldError, FieldHint, Input, Label, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { TableRowSkeleton } from "../../components/ui/Skeleton";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import type { AdminCoupon, AdminCouponStatus, Paginated } from "../../lib/types";
import { formatCurrency, formatDateTime, formatNumber } from "../../lib/utils";

const PAGE_SIZE = 10;
const STATUS_LABEL: Record<AdminCouponStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Đã tắt",
  UPCOMING: "Sắp diễn ra",
  EXPIRED: "Đã hết hạn",
  EXHAUSTED: "Hết lượt",
};
const STATUS_TONE: Record<AdminCouponStatus, BadgeTone> = {
  ACTIVE: "ok",
  INACTIVE: "neutral",
  UPCOMING: "info",
  EXPIRED: "danger",
  EXHAUSTED: "warning",
};

type CouponForm = {
  code: string;
  discountType: "PERCENT" | "FIXED";
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof CouponForm, string>>;

function toLocalDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function emptyForm(): CouponForm {
  const startsAt = new Date();
  startsAt.setSeconds(0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 30);
  return {
    code: "",
    discountType: "PERCENT",
    value: "10",
    minOrderAmount: "0",
    maxDiscount: "",
    usageLimit: "",
    startsAt: toLocalDateTime(startsAt),
    endsAt: toLocalDateTime(endsAt),
    isActive: true,
  };
}

function formFromCoupon(coupon: AdminCoupon): CouponForm {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    value: String(coupon.value),
    minOrderAmount: coupon.minOrderAmount == null ? "" : String(coupon.minOrderAmount),
    maxDiscount: coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
    usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
    startsAt: toLocalDateTime(coupon.startsAt),
    endsAt: toLocalDateTime(coupon.endsAt),
    isActive: coupon.isActive,
  };
}

function validate(form: CouponForm) {
  const errors: FormErrors = {};
  const code = form.code.trim();
  const value = Number(form.value);
  const minOrderAmount = form.minOrderAmount === "" ? null : Number(form.minOrderAmount);
  const maxDiscount = form.maxDiscount === "" ? null : Number(form.maxDiscount);
  const usageLimit = form.usageLimit === "" ? null : Number(form.usageLimit);
  const startsAt = new Date(form.startsAt);
  const endsAt = new Date(form.endsAt);

  if (!/^[A-Za-z0-9_-]{3,40}$/.test(code)) {
    errors.code = "Dùng 3–40 ký tự: chữ, số, dấu gạch dưới hoặc gạch ngang.";
  }
  if (!Number.isFinite(value) || value <= 0) errors.value = "Giá trị phải lớn hơn 0.";
  else if (form.discountType === "PERCENT" && value > 100) {
    errors.value = "Phần trăm giảm không được vượt quá 100%.";
  }
  if (minOrderAmount !== null && (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)) {
    errors.minOrderAmount = "Giá trị đơn tối thiểu phải là số không âm.";
  }
  if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
    errors.maxDiscount = "Mức giảm tối đa phải là số không âm.";
  }
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
    errors.usageLimit = "Giới hạn lượt dùng phải là số nguyên lớn hơn 0.";
  }
  if (!form.startsAt || Number.isNaN(startsAt.getTime())) errors.startsAt = "Ngày bắt đầu không hợp lệ.";
  if (!form.endsAt || Number.isNaN(endsAt.getTime())) errors.endsAt = "Ngày kết thúc không hợp lệ.";
  else if (!errors.startsAt && endsAt <= startsAt) errors.endsAt = "Ngày kết thúc phải sau ngày bắt đầu.";
  return errors;
}

function CouponFormModal({
  couponId,
  onClose,
  onSaved,
}: {
  couponId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(Boolean(couponId));
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!couponId) return;
    let ignore = false;
    api<AdminCoupon>(`/api/v1/admin/coupons/${couponId}`)
      .then((coupon) => {
        if (!ignore) setForm(formFromCoupon(coupon));
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setDetailError(requestError instanceof Error ? requestError.message : "Không tải được mã giảm giá.");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [couponId]);

  function setField<Key extends keyof CouponForm>(key: Key, value: CouponForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount === "" ? null : Number(form.minOrderAmount),
      maxDiscount:
        form.discountType === "PERCENT" && form.maxDiscount !== ""
          ? Number(form.maxDiscount)
          : null,
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      await api(couponId ? `/api/v1/admin/coupons/${couponId}` : "/api/v1/admin/coupons", {
        method: couponId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(couponId ? "Đã cập nhật mã giảm giá." : "Đã tạo mã giảm giá mới.");
      onSaved();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể lưu mã giảm giá.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={couponId ? "Sửa mã giảm giá" : "Tạo mã giảm giá"}
      className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto"
    >
      {loading ? (
        <p className="py-12 text-center text-sm text-muted">Đang tải dữ liệu…</p>
      ) : detailError ? (
        <ErrorState message={detailError} />
      ) : (
        <form noValidate onSubmit={submit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="coupon-code">Mã giảm giá *</Label>
              <Input
                id="coupon-code"
                autoFocus
                value={form.code}
                onChange={(event) => setField("code", event.target.value.toUpperCase())}
                placeholder="VD: SUMMER20"
                error={Boolean(errors.code)}
              />
              <FieldError>{errors.code}</FieldError>
            </div>
            <div>
              <Label htmlFor="coupon-type">Loại giảm giá *</Label>
              <Select
                id="coupon-type"
                value={form.discountType}
                onChange={(event) => setField("discountType", event.target.value as CouponForm["discountType"])}
              >
                <option value="PERCENT">Theo phần trăm</option>
                <option value="FIXED">Số tiền cố định</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="coupon-value">
                {form.discountType === "PERCENT" ? "Phần trăm giảm *" : "Số tiền giảm *"}
              </Label>
              <Input
                id="coupon-value"
                type="number"
                min="0"
                step={form.discountType === "PERCENT" ? "0.01" : "1000"}
                value={form.value}
                onChange={(event) => setField("value", event.target.value)}
                error={Boolean(errors.value)}
              />
              <FieldError>{errors.value}</FieldError>
            </div>
            <div>
              <Label htmlFor="coupon-min">Đơn hàng tối thiểu</Label>
              <Input
                id="coupon-min"
                type="number"
                min="0"
                step="1000"
                value={form.minOrderAmount}
                onChange={(event) => setField("minOrderAmount", event.target.value)}
                error={Boolean(errors.minOrderAmount)}
              />
              <FieldError>{errors.minOrderAmount}</FieldError>
            </div>
            {form.discountType === "PERCENT" && (
              <div>
                <Label htmlFor="coupon-cap">Mức giảm tối đa</Label>
                <Input
                  id="coupon-cap"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.maxDiscount}
                  onChange={(event) => setField("maxDiscount", event.target.value)}
                  error={Boolean(errors.maxDiscount)}
                />
                <FieldError>{errors.maxDiscount}</FieldError>
              </div>
            )}
            <div>
              <Label htmlFor="coupon-limit">Giới hạn lượt sử dụng</Label>
              <Input
                id="coupon-limit"
                type="number"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(event) => setField("usageLimit", event.target.value)}
                error={Boolean(errors.usageLimit)}
              />
              <FieldHint>Để trống nếu không giới hạn.</FieldHint>
              <FieldError>{errors.usageLimit}</FieldError>
            </div>
            <div>
              <Label htmlFor="coupon-start">Bắt đầu *</Label>
              <Input
                id="coupon-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => setField("startsAt", event.target.value)}
                error={Boolean(errors.startsAt)}
              />
              <FieldError>{errors.startsAt}</FieldError>
            </div>
            <div>
              <Label htmlFor="coupon-end">Kết thúc *</Label>
              <Input
                id="coupon-end"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => setField("endsAt", event.target.value)}
                error={Boolean(errors.endsAt)}
              />
              <FieldError>{errors.endsAt}</FieldError>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setField("isActive", event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span>
              <span className="block text-sm font-semibold">Kích hoạt mã giảm giá</span>
              <span className="mt-0.5 block text-xs text-muted">
                Mã chỉ dùng được khi đang bật và nằm trong thời gian hiệu lực.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" isLoading={saving}>{couponId ? "Lưu thay đổi" : "Tạo mã"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AdminCouponsPage() {
  const toast = useToast();
  const [result, setResult] = useState<Paginated<AdminCoupon> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminCoupon | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    try {
      setResult(await api<Paginated<AdminCoupon>>(`/api/v1/admin/coupons?${params}`));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tải được danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  async function toggle(coupon: AdminCoupon) {
    setActionLoading(coupon.id);
    try {
      await api(`/api/v1/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      toast.success(coupon.isActive ? "Đã tắt mã giảm giá." : "Đã bật mã giảm giá.");
      void load();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể đổi trạng thái.");
    } finally {
      setActionLoading(null);
    }
  }

  async function remove() {
    if (!deleting) return;
    setActionLoading(deleting.id);
    try {
      await api(`/api/v1/admin/coupons/${deleting.id}`, { method: "DELETE" });
      toast.success("Đã xóa mã giảm giá.");
      setDeleting(null);
      void load();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể xóa mã giảm giá.");
    } finally {
      setActionLoading(null);
    }
  }

  const items = result?.items ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Mã giảm giá</h1>
          <p className="text-sm text-muted">
            {result ? `${result.pagination.total} mã giảm giá` : "Quản lý coupon của cửa hàng"}
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden /> Tạo mã giảm giá
        </Button>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-2">
          <form onSubmit={search} className="flex min-w-64 flex-1 gap-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo mã coupon…"
              aria-label="Tìm mã giảm giá"
              icon={<Search className="h-4 w-4" aria-hidden />}
            />
            <Button type="submit" variant="secondary">Tìm</Button>
          </form>
          <Select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            className="w-auto min-w-44"
            aria-label="Lọc trạng thái mã giảm giá"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <Card><table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, index) => <TableRowSkeleton key={index} cols={7} />)}</tbody></table></Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-6 w-6" />}
          title="Chưa có mã giảm giá"
          description="Tạo mã đầu tiên hoặc thay đổi điều kiện tìm kiếm."
          action={<Button size="sm" onClick={() => { setEditingId(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tạo mã</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Ưu đãi</th>
                  <th className="px-4 py-3">Điều kiện</th>
                  <th className="px-4 py-3">Đã dùng</th>
                  <th className="px-4 py-3">Hiệu lực</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3 font-bold tracking-wide">{coupon.code}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">
                      {coupon.discountType === "PERCENT" ? `${coupon.value}%` : formatCurrency(coupon.value)}
                      {coupon.maxDiscount != null && <p className="text-xs font-normal text-muted">Tối đa {formatCurrency(coupon.maxDiscount)}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      Từ {formatCurrency(coupon.minOrderAmount ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatNumber(coupon.usedCount)} / {coupon.usageLimit == null ? "∞" : formatNumber(coupon.usageLimit)}
                    </td>
                    <td className="min-w-48 px-4 py-3 text-xs text-muted">
                      <p>{formatDateTime(coupon.startsAt)}</p>
                      <p>đến {formatDateTime(coupon.endsAt)}</p>
                    </td>
                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[coupon.status]}>{STATUS_LABEL[coupon.status]}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void toggle(coupon)}
                          disabled={actionLoading === coupon.id}
                          aria-label={coupon.isActive ? `Tắt ${coupon.code}` : `Bật ${coupon.code}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink disabled:opacity-50"
                        >
                          {coupon.isActive ? <ToggleRight className="h-5 w-5 text-ok" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(coupon.id); setFormOpen(true); }}
                          aria-label={`Sửa ${coupon.code}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
                        ><Pencil className="h-4 w-4" /></button>
                        <button
                          type="button"
                          onClick={() => setDeleting(coupon)}
                          disabled={!coupon.canDelete}
                          title={coupon.canDelete ? "Xóa mã" : "Mã đã được sử dụng; hãy tắt thay vì xóa"}
                          aria-label={`Xóa ${coupon.code}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-35"
                        ><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!error && !loading && result && result.pagination.totalPages > 1 && (
        <Pagination meta={result.pagination} onPageChange={setPage} className="mt-6" />
      )}

      {formOpen && (
        <CouponFormModal
          couponId={editingId}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); setEditingId(null); void load(); }}
        />
      )}

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Xóa mã giảm giá" className="max-w-md">
        {deleting && (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-muted">
              Xóa vĩnh viễn mã <strong className="text-ink">{deleting.code}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={actionLoading === deleting.id}>Hủy</Button>
              <Button variant="danger" onClick={() => void remove()} isLoading={actionLoading === deleting.id}>Xóa mã</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
