import { useCallback, useEffect, useState, type FormEvent } from "react";
import { EyeOff, ImageOff, Pencil, Plus, Search } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { formatCurrency } from "../../lib/utils";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TONE } from "../../lib/status";
import type { AdminProduct, Paginated } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Label, Select, Textarea } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ErrorState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { TableRowSkeleton } from "../../components/ui/Skeleton";

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

type FormState = typeof emptyForm;

function ProductFormModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: AdminProduct | null;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        price: String(editing.price),
        salePrice: editing.salePrice != null ? String(editing.salePrice) : "",
        stock: String(editing.stock),
        sku: editing.sku ?? "",
        status: editing.status ?? "ACTIVE",
        imageUrl: editing.images?.[0]?.url ?? "",
        description: editing.description ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock),
        sku: form.sku || undefined,
        status: form.status,
        description: form.description || undefined,
        images: form.imageUrl ? [{ url: form.imageUrl }] : [],
      };

      if (editing) {
        await api(`/api/v1/admin/products/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Đã lưu thay đổi sản phẩm");
      } else {
        await api("/api/v1/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Đã tạo sản phẩm mới");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lưu sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"} className="max-w-2xl">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
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
        <div className="sm:col-span-2">
          <Label htmlFor="p-desc">Mô tả</Label>
          <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="p-status">Trạng thái</Label>
          <Select id="p-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.entries(PRODUCT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={saving}>
            {editing ? "Lưu thay đổi" : "Tạo sản phẩm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminProductsPage() {
  const toast = useToast();
  const [result, setResult] = useState<Paginated<AdminProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (q) qs.set("q", q);
      const data = await api<Paginated<AdminProduct>>(`/api/v1/admin/products?${qs.toString()}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(searchInput.trim());
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p: AdminProduct) {
    setEditing(p);
    setModalOpen(true);
  }

  async function hideProduct(p: AdminProduct) {
    if (!window.confirm(`Ẩn sản phẩm "${p.name}"?`)) return;
    try {
      await api(`/api/v1/admin/products/${p.id}`, { method: "DELETE" });
      toast.success("Đã ẩn sản phẩm");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không ẩn được sản phẩm");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Sản phẩm</h1>
          <p className="text-sm text-muted">
            {result ? `${result.pagination.total} sản phẩm` : "Quản lý danh sách sản phẩm"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Button>
      </div>

      <form onSubmit={onSearchSubmit} className="mb-4 flex gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên, SKU..."
          icon={<Search className="h-4 w-4" />}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">Tìm</Button>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Giá</th>
                  <th className="px-4 py-3">Tồn kho</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}

                {!loading && result?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      Không có sản phẩm nào.
                    </td>
                  </tr>
                )}

                {!loading &&
                  result?.items.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white">
                            {p.images?.[0]?.url ? (
                              <img src={p.images[0].url} alt={p.name} className="h-full w-full object-contain" />
                            ) : (
                              <ImageOff className="h-4 w-4 text-muted" />
                            )}
                          </div>
                          <span className="line-clamp-2 max-w-xs font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{p.sku || "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-accent">{formatCurrency(p.salePrice ?? p.price)}</p>
                        {p.salePrice ? (
                          <p className="text-xs text-muted line-through">{formatCurrency(p.price)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={p.stock === 0 ? "danger" : p.stock <= 5 ? "warning" : "neutral"}>
                          {p.stock}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={PRODUCT_STATUS_TONE[p.status ?? "DRAFT"] ?? "neutral"}>
                          {PRODUCT_STATUS_LABEL[p.status ?? "DRAFT"] ?? p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            aria-label="Sửa sản phẩm"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => hideProduct(p)}
                            aria-label="Ẩn sản phẩm"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger"
                          >
                            <EyeOff className="h-4 w-4" />
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

      {result && (
        <Pagination meta={result.pagination} onPageChange={setPage} className="mt-6" />
      )}

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        editing={editing}
      />
    </div>
  );
}
