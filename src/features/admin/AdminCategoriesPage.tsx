import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  FolderTree,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
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
import type { AdminCategory, Paginated } from "../../lib/types";
import { formatDateTime } from "../../lib/utils";

const PAGE_SIZE = 20;

type CategoryForm = {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof CategoryForm, string>>;

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

function emptyForm(): CategoryForm {
  return {
    name: "",
    slug: "",
    parentId: "",
    description: "",
    imageUrl: "",
    sortOrder: "0",
    seoTitle: "",
    seoDescription: "",
    isActive: true,
  };
}

function formFromCategory(category: AdminCategory): CategoryForm {
  return {
    name: category.name,
    slug: category.slug,
    parentId: category.parentId ?? "",
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    sortOrder: String(category.sortOrder),
    seoTitle: category.seoTitle ?? "",
    seoDescription: category.seoDescription ?? "",
    isActive: category.isActive,
  };
}

function validate(form: CategoryForm) {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2) errors.name = "Tên danh mục phải có ít nhất 2 ký tự.";
  if (form.imageUrl.trim() && !isHttpUrl(form.imageUrl.trim())) {
    errors.imageUrl = "URL ảnh phải bắt đầu bằng http:// hoặc https://.";
  }
  if (form.sortOrder.trim() !== "" && !Number.isInteger(Number(form.sortOrder))) {
    errors.sortOrder = "Thứ tự phải là số nguyên.";
  }
  if (form.seoTitle.trim().length > 70) errors.seoTitle = "SEO title tối đa 70 ký tự.";
  if (form.seoDescription.trim().length > 320) {
    errors.seoDescription = "SEO description tối đa 320 ký tự.";
  }
  return errors;
}

function buildDepthById(categories: AdminCategory[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const cache = new Map<string, number>();

  function depthOf(id: string, guard: Set<string>): number {
    if (cache.has(id)) return cache.get(id) as number;
    const category = byId.get(id);
    if (!category?.parentId || guard.has(id)) return 0;
    guard.add(id);
    const depth = 1 + depthOf(category.parentId, guard);
    cache.set(id, depth);
    return depth;
  }

  const result = new Map<string, number>();
  categories.forEach((category) => result.set(category.id, depthOf(category.id, new Set())));
  return result;
}

function collectDescendantIds(categories: AdminCategory[], rootId: string) {
  const childrenByParent = new Map<string, string[]>();
  categories.forEach((category) => {
    if (!category.parentId) return;
    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category.id);
    childrenByParent.set(category.parentId, siblings);
  });

  const result = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    for (const childId of childrenByParent.get(current) ?? []) {
      if (!result.has(childId)) {
        result.add(childId);
        queue.push(childId);
      }
    }
  }
  return result;
}

function CategoryFormModal({
  categoryId,
  allCategories,
  onClose,
  onSaved,
}: {
  categoryId: string | null;
  allCategories: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(Boolean(categoryId));
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!categoryId) return;
    let ignore = false;
    api<AdminCategory>(`/api/v1/admin/categories/${categoryId}`)
      .then((category) => {
        if (!ignore) setForm(formFromCategory(category));
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setDetailError(
            requestError instanceof Error ? requestError.message : "Không tải được danh mục.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [categoryId]);

  function setField<Key extends keyof CategoryForm>(key: Key, value: CategoryForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  const depthById = buildDepthById(allCategories);
  const excludedIds = categoryId
    ? new Set([categoryId, ...collectDescendantIds(allCategories, categoryId)])
    : new Set<string>();
  const parentOptions = allCategories
    .filter((category) => !excludedIds.has(category.id))
    .map((category) => ({
      id: category.id,
      label: `${"— ".repeat(depthById.get(category.id) ?? 0)}${category.name}`,
    }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      slug: nullableText(form.slug),
      parentId: form.parentId || null,
      description: nullableText(form.description),
      imageUrl: nullableText(form.imageUrl),
      seoTitle: nullableText(form.seoTitle),
      seoDescription: nullableText(form.seoDescription),
      sortOrder: form.sortOrder.trim() === "" ? 0 : Number(form.sortOrder),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      await api(categoryId ? `/api/v1/admin/categories/${categoryId}` : "/api/v1/admin/categories", {
        method: categoryId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(categoryId ? "Đã cập nhật danh mục." : "Đã tạo danh mục mới.");
      onSaved();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể lưu danh mục.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={categoryId ? "Sửa danh mục" : "Tạo danh mục"}
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
              <Label htmlFor="category-name">Tên danh mục *</Label>
              <Input
                id="category-name"
                autoFocus
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                error={Boolean(errors.name)}
              />
              <FieldError>{errors.name}</FieldError>
            </div>
            <div>
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={form.slug}
                placeholder="Tự tạo từ tên nếu để trống"
                onChange={(event) => setField("slug", event.target.value)}
                error={Boolean(errors.slug)}
              />
              <FieldError>{errors.slug}</FieldError>
            </div>
            <div>
              <Label htmlFor="category-parent">Danh mục cha</Label>
              <Select
                id="category-parent"
                value={form.parentId}
                onChange={(event) => setField("parentId", event.target.value)}
              >
                <option value="">Không có (danh mục gốc)</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="category-sort">Thứ tự hiển thị</Label>
              <Input
                id="category-sort"
                type="number"
                step={1}
                value={form.sortOrder}
                onChange={(event) => setField("sortOrder", event.target.value)}
                error={Boolean(errors.sortOrder)}
              />
              <FieldError>{errors.sortOrder}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="category-image">URL ảnh</Label>
              <Input
                id="category-image"
                type="url"
                placeholder="https://…"
                value={form.imageUrl}
                onChange={(event) => setField("imageUrl", event.target.value)}
                error={Boolean(errors.imageUrl)}
              />
              <FieldError>{errors.imageUrl}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="category-description">Mô tả</Label>
              <Textarea
                id="category-description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-seo-title">SEO title</Label>
              <Input
                id="category-seo-title"
                maxLength={70}
                value={form.seoTitle}
                onChange={(event) => setField("seoTitle", event.target.value)}
                error={Boolean(errors.seoTitle)}
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <FieldError>{errors.seoTitle}</FieldError>
                <span>{form.seoTitle.trim().length}/70</span>
              </div>
            </div>
            <div>
              <Label htmlFor="category-seo-description">SEO description</Label>
              <Textarea
                id="category-seo-description"
                maxLength={320}
                value={form.seoDescription}
                onChange={(event) => setField("seoDescription", event.target.value)}
                error={Boolean(errors.seoDescription)}
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <FieldError>{errors.seoDescription}</FieldError>
                <span>{form.seoDescription.trim().length}/320</span>
              </div>
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
              <span className="block text-sm font-semibold">Hiển thị danh mục</span>
              <span className="mt-0.5 block text-xs text-muted">
                Danh mục ẩn sẽ không xuất hiện trên cửa hàng và không thể chọn cho sản phẩm mới.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" isLoading={saving}>
              {categoryId ? "Lưu thay đổi" : "Tạo danh mục"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function AdminCategoriesPage() {
  const toast = useToast();
  const [result, setResult] = useState<Paginated<AdminCategory> | null>(null);
  const [allCategories, setAllCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isActive, setIsActive] = useState("");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (query) params.set("q", query);
    if (isActive) params.set("isActive", isActive);
    try {
      setResult(await api<Paginated<AdminCategory>>(`/api/v1/admin/categories?${params}`));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không tải được danh sách danh mục.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, query, isActive]);

  const loadAllForParentOptions = useCallback(async () => {
    try {
      const data = await api<Paginated<AdminCategory>>("/api/v1/admin/categories?pageSize=100");
      setAllCategories(data.items);
    } catch {
      // The parent selector degrades to "no parent options" if this fails; the main list still works.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadAllForParentOptions();
  }, [loadAllForParentOptions]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  function afterSave() {
    setFormOpen(false);
    setEditingId(null);
    void load();
    void loadAllForParentOptions();
  }

  async function toggle(category: AdminCategory) {
    setActionLoading(category.id);
    try {
      await api(`/api/v1/admin/categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      toast.success(category.isActive ? "Đã ẩn danh mục." : "Đã hiện danh mục.");
      void load();
      void loadAllForParentOptions();
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
      await api(`/api/v1/admin/categories/${deleting.id}`, { method: "DELETE" });
      toast.success("Đã xóa danh mục.");
      setDeleting(null);
      void load();
      void loadAllForParentOptions();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể xóa danh mục.");
    } finally {
      setActionLoading(null);
    }
  }

  const items = result?.items ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Danh mục</h1>
          <p className="text-sm text-muted">
            {result ? `${result.pagination.total} danh mục` : "Quản lý danh mục sản phẩm"}
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden /> Tạo danh mục
        </Button>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-2">
          <form onSubmit={search} className="flex min-w-64 flex-1 gap-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên, slug…"
              aria-label="Tìm danh mục"
              icon={<Search className="h-4 w-4" aria-hidden />}
            />
            <Button type="submit" variant="secondary">Tìm</Button>
          </form>
          <Select
            value={isActive}
            onChange={(event) => { setIsActive(event.target.value); setPage(1); }}
            className="w-auto min-w-44"
            aria-label="Lọc trạng thái danh mục"
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
                <TableRowSkeleton key={index} cols={6} />
              ))}
            </tbody>
          </table>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-6 w-6" />}
          title="Chưa có danh mục"
          description="Tạo danh mục đầu tiên hoặc thay đổi điều kiện tìm kiếm."
          action={
            <Button size="sm" onClick={() => { setEditingId(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Tạo danh mục
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Danh mục</th>
                  <th className="px-4 py-3">Danh mục cha</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Thứ tự</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((category) => (
                  <tr key={category.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{category.name}</p>
                      <p className="mt-0.5 text-xs text-muted">/{category.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{category.parent?.name ?? "—"}</td>
                    <td className="px-4 py-3">{category.productCount}</td>
                    <td className="px-4 py-3 text-muted">{category.sortOrder}</td>
                    <td className="px-4 py-3">
                      <Badge tone={category.isActive ? "ok" : "neutral"}>
                        {category.isActive ? "Đang hiện" : "Đã ẩn"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void toggle(category)}
                          disabled={actionLoading === category.id}
                          aria-label={category.isActive ? `Ẩn ${category.name}` : `Hiện ${category.name}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink disabled:opacity-50"
                        >
                          {category.isActive ? (
                            <ToggleRight className="h-5 w-5 text-ok" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(category.id); setFormOpen(true); }}
                          aria-label={`Sửa ${category.name}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(category)}
                          disabled={!category.canDelete}
                          title={
                            category.canDelete
                              ? "Xóa danh mục"
                              : "Danh mục còn danh mục con hoặc sản phẩm; hãy ẩn thay vì xóa"
                          }
                          aria-label={`Xóa ${category.name}`}
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
        <CategoryFormModal
          categoryId={editingId}
          allCategories={allCategories}
          onClose={() => setFormOpen(false)}
          onSaved={afterSave}
        />
      )}

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Xóa danh mục" className="max-w-md">
        {deleting && (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-muted">
              Xóa vĩnh viễn danh mục <strong className="text-ink">{deleting.name}</strong>? Thao tác này
              không thể hoàn tác.
            </p>
            <p className="text-xs text-muted">Cập nhật lần cuối: {formatDateTime(deleting.updatedAt)}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={actionLoading === deleting.id}>
                Hủy
              </Button>
              <Button variant="danger" onClick={() => void remove()} isLoading={actionLoading === deleting.id}>
                Xóa danh mục
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
