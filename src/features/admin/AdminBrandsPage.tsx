import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Award, Pencil, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";
import { FieldError, Input, Label, Select, Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { TableRowSkeleton } from "../../components/ui/Skeleton";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import type { AdminBrand, Paginated } from "../../lib/types";
import { formatDateTime } from "../../lib/utils";

const PAGE_SIZE = 20;

type BrandForm = {
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof BrandForm, string>>;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function nullableText(value: string) {
  return optionalText(value) ?? null;
}

function emptyForm(): BrandForm {
  return { name: "", slug: "", logoUrl: "", description: "", isActive: true };
}

function formFromBrand(brand: AdminBrand): BrandForm {
  return {
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl ?? "",
    description: brand.description ?? "",
    isActive: brand.isActive,
  };
}

function validate(form: BrandForm) {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2) errors.name = "Tên thương hiệu phải có ít nhất 2 ký tự.";
  if (form.logoUrl.trim() && !isHttpUrl(form.logoUrl.trim())) {
    errors.logoUrl = "URL logo phải bắt đầu bằng http:// hoặc https://.";
  }
  return errors;
}

function BrandFormModal({
  brandId,
  onClose,
  onSaved,
}: {
  brandId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(Boolean(brandId));
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!brandId) return;
    let ignore = false;
    api<AdminBrand>(`/api/v1/admin/brands/${brandId}`)
      .then((brand) => {
        if (!ignore) setForm(formFromBrand(brand));
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setDetailError(
            requestError instanceof Error ? requestError.message : "Không tải được thương hiệu.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [brandId]);

  function setField<Key extends keyof BrandForm>(key: Key, value: BrandForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      slug: nullableText(form.slug),
      logoUrl: nullableText(form.logoUrl),
      description: nullableText(form.description),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      await api(brandId ? `/api/v1/admin/brands/${brandId}` : "/api/v1/admin/brands", {
        method: brandId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(brandId ? "Đã cập nhật thương hiệu." : "Đã tạo thương hiệu mới.");
      onSaved();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể lưu thương hiệu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={brandId ? "Sửa thương hiệu" : "Tạo thương hiệu"}
      className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto"
    >
      {loading ? (
        <p className="py-12 text-center text-sm text-muted">Đang tải dữ liệu…</p>
      ) : detailError ? (
        <ErrorState message={detailError} />
      ) : (
        <form noValidate onSubmit={submit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="brand-name">Tên thương hiệu *</Label>
              <Input
                id="brand-name"
                autoFocus
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                error={Boolean(errors.name)}
              />
              <FieldError>{errors.name}</FieldError>
            </div>
            <div>
              <Label htmlFor="brand-slug">Slug</Label>
              <Input
                id="brand-slug"
                value={form.slug}
                placeholder="Tự tạo từ tên nếu để trống"
                onChange={(event) => setField("slug", event.target.value)}
                error={Boolean(errors.slug)}
              />
              <FieldError>{errors.slug}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="brand-logo">URL logo</Label>
              <Input
                id="brand-logo"
                type="url"
                placeholder="https://…"
                value={form.logoUrl}
                onChange={(event) => setField("logoUrl", event.target.value)}
                error={Boolean(errors.logoUrl)}
              />
              <FieldError>{errors.logoUrl}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="brand-description">Mô tả</Label>
              <Textarea
                id="brand-description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
              />
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
              <span className="block text-sm font-semibold">Hiển thị thương hiệu</span>
              <span className="mt-0.5 block text-xs text-muted">
                Thương hiệu ẩn sẽ không xuất hiện trên cửa hàng và không thể chọn cho sản phẩm mới.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" isLoading={saving}>
              {brandId ? "Lưu thay đổi" : "Tạo thương hiệu"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AdminBrandsPage() {
  const toast = useToast();
  const [result, setResult] = useState<Paginated<AdminBrand> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isActive, setIsActive] = useState("");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminBrand | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (query) params.set("q", query);
    if (isActive) params.set("isActive", isActive);
    try {
      setResult(await api<Paginated<AdminBrand>>(`/api/v1/admin/brands?${params}`));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không tải được danh sách thương hiệu.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, query, isActive]);

  useEffect(() => {
    void load();
  }, [load]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  async function toggle(brand: AdminBrand) {
    setActionLoading(brand.id);
    try {
      await api(`/api/v1/admin/brands/${brand.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !brand.isActive }),
      });
      toast.success(brand.isActive ? "Đã ẩn thương hiệu." : "Đã hiện thương hiệu.");
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
      await api(`/api/v1/admin/brands/${deleting.id}`, { method: "DELETE" });
      toast.success("Đã xóa thương hiệu.");
      setDeleting(null);
      void load();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể xóa thương hiệu.");
    } finally {
      setActionLoading(null);
    }
  }

  const items = result?.items ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Thương hiệu</h1>
          <p className="text-sm text-muted">
            {result ? `${result.pagination.total} thương hiệu` : "Quản lý thương hiệu sản phẩm"}
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden /> Tạo thương hiệu
        </Button>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-2">
          <form onSubmit={search} className="flex min-w-64 flex-1 gap-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên, slug…"
              aria-label="Tìm thương hiệu"
              icon={<Search className="h-4 w-4" aria-hidden />}
            />
            <Button type="submit" variant="secondary">Tìm</Button>
          </form>
          <Select
            value={isActive}
            onChange={(event) => { setIsActive(event.target.value); setPage(1); }}
            className="w-auto min-w-44"
            aria-label="Lọc trạng thái thương hiệu"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hiện</option>
            <option value="false">Đã ẩn</option>
          </Select>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <Card>
          <table className="w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton key={index} cols={5} />
              ))}
            </tbody>
          </table>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Award className="h-6 w-6" />}
          title="Chưa có thương hiệu"
          description="Tạo thương hiệu đầu tiên hoặc thay đổi điều kiện tìm kiếm."
          action={
            <Button size="sm" onClick={() => { setEditingId(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Tạo thương hiệu
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Thương hiệu</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((brand) => (
                  <tr key={brand.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-contain" />
                          ) : (
                            <Award className="h-4 w-4 text-muted" aria-hidden />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{brand.name}</p>
                          <p className="mt-0.5 text-xs text-muted">/{brand.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{brand.productCount}</td>
                    <td className="px-4 py-3">
                      <Badge tone={brand.isActive ? "ok" : "neutral"}>
                        {brand.isActive ? "Đang hiện" : "Đã ẩn"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatDateTime(brand.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void toggle(brand)}
                          disabled={actionLoading === brand.id}
                          aria-label={brand.isActive ? `Ẩn ${brand.name}` : `Hiện ${brand.name}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink disabled:opacity-50"
                        >
                          {brand.isActive ? (
                            <ToggleRight className="h-5 w-5 text-ok" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(brand.id); setFormOpen(true); }}
                          aria-label={`Sửa ${brand.name}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(brand)}
                          disabled={!brand.canDelete}
                          title={brand.canDelete ? "Xóa thương hiệu" : "Thương hiệu còn sản phẩm; hãy ẩn thay vì xóa"}
                          aria-label={`Xóa ${brand.name}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        <BrandFormModal
          brandId={editingId}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); setEditingId(null); void load(); }}
        />
      )}

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Xóa thương hiệu" className="max-w-md">
        {deleting && (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-muted">
              Xóa vĩnh viễn thương hiệu <strong className="text-ink">{deleting.name}</strong>? Thao tác
              này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={actionLoading === deleting.id}>
                Hủy
              </Button>
              <Button variant="danger" onClick={() => void remove()} isLoading={actionLoading === deleting.id}>
                Xóa thương hiệu
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
