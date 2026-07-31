import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  EyeOff,
  ImageOff,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { api } from "../../lib/api";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TONE } from "../../lib/status";
import { useToast } from "../../lib/toast";
import type { AdminProduct, Brand, Category, Paginated } from "../../lib/types";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState } from "../../components/ui/EmptyState";
import { FieldError, Input, Label, Select, Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton, TableRowSkeleton } from "../../components/ui/Skeleton";

const PAGE_SIZE = 15;
const DEFAULT_SORT = "updated_desc";
const STOCK_OPTIONS = [
  { value: "out", label: "Hết hàng" },
  { value: "low", label: "Sắp hết hàng" },
  { value: "in", label: "Còn hàng" },
];
const SORT_OPTIONS = [
  { value: "updated_desc", label: "Mới cập nhật" },
  { value: "created_desc", label: "Mới tạo" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "stock_asc", label: "Tồn kho tăng dần" },
  { value: "stock_desc", label: "Tồn kho giảm dần" },
];
const FILTER_KEYS = ["q", "status", "categoryId", "brandId", "stockStatus", "sort"];

type CategoryOption = {
  id: string;
  label: string;
};

type ImageRow = {
  key: string;
  url: string;
  alt: string;
};

type VariantRow = {
  key: string;
  id?: string;
  canDelete?: boolean;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: string;
  salePrice: string;
  stock: string;
};

type ProductFormState = {
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  status: string;
  price: string;
  salePrice: string;
  stock: string;
  sku: string;
  barcode: string;
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSaleEndsAt: string;
  videoUrl: string;
  specs: string;
  images: ImageRow[];
  variants: VariantRow[];
};

type FormErrors = Record<string, string | undefined>;
type ProductAction = "hide" | "restore";
type PendingAction = { product: AdminProduct; action: ProductAction };

let rowSequence = 0;

function nextRowKey(prefix: string) {
  rowSequence += 1;
  return `${prefix}-${rowSequence}`;
}

function createImageRow(): ImageRow {
  return { key: nextRowKey("image"), url: "", alt: "" };
}

function createVariantRow(): VariantRow {
  return {
    key: nextRowKey("variant"),
    name: "",
    sku: "",
    color: "",
    size: "",
    price: "",
    salePrice: "",
    stock: "0",
  };
}

function createEmptyForm(): ProductFormState {
  return {
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    status: "DRAFT",
    price: "",
    salePrice: "",
    stock: "0",
    sku: "",
    barcode: "",
    isFeatured: false,
    isFlashSale: false,
    flashSaleEndsAt: "",
    videoUrl: "",
    specs: "",
    images: [createImageRow()],
    variants: [],
  };
}

function flattenCategories(categories: Category[], depth = 0): CategoryOption[] {
  return categories.flatMap((category) => [
    { id: category.id, label: `${"— ".repeat(depth)}${category.name}` },
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

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

function getEffectiveStock(form: ProductFormState) {
  if (form.variants.length === 0) return Number(form.stock);

  return form.variants.reduce((total, variant) => {
    const stock = Number(variant.stock);
    if (!Number.isFinite(stock)) return total;
    const nextTotal = total + stock;
    return Number.isFinite(nextTotal) ? nextTotal : total;
  }, 0);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formFromProduct(product: AdminProduct): ProductFormState {
  return {
    name: product.name,
    description: product.description ?? "",
    categoryId: product.categoryId ?? product.category?.id ?? "",
    brandId: product.brandId ?? product.brand?.id ?? "",
    status: product.status ?? "DRAFT",
    price: String(product.price),
    salePrice: product.salePrice == null ? "" : String(product.salePrice),
    stock: String(product.stock),
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    isFeatured: product.isFeatured ?? false,
    isFlashSale: product.isFlashSale ?? false,
    flashSaleEndsAt: toDateTimeLocal(product.flashSaleEndsAt),
    videoUrl: product.videoUrl ?? "",
    specs: product.specs ? JSON.stringify(product.specs, null, 2) : "",
    images:
      product.images && product.images.length > 0
        ? product.images.map((image) => ({
            key: nextRowKey("image"),
            url: image.url,
            alt: image.alt ?? "",
          }))
        : [createImageRow()],
    variants:
      product.variants?.map((variant) => ({
        key: nextRowKey("variant"),
        id: variant.id,
        canDelete: variant.canDelete,
        name: variant.name,
        sku: variant.sku ?? "",
        color: variant.color ?? "",
        size: variant.size ?? "",
        price: variant.price == null ? "" : String(variant.price),
        salePrice: variant.salePrice == null ? "" : String(variant.salePrice),
        stock: String(variant.stock),
      })) ?? [],
  };
}

function validateForm(form: ProductFormState) {
  const errors: FormErrors = {};
  let specs: Record<string, unknown> | null = null;
  const price = Number(form.price);
  const salePrice = form.salePrice.trim() === "" ? null : Number(form.salePrice);
  const stock = getEffectiveStock(form);

  if (form.name.trim().length < 2) errors.name = "Tên sản phẩm phải có ít nhất 2 ký tự.";
  if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
    errors.price = "Giá phải là số lớn hơn hoặc bằng 0.";
  }
  if (salePrice != null && (!Number.isFinite(salePrice) || salePrice < 0)) {
    errors.salePrice = "Giá khuyến mãi phải là số lớn hơn hoặc bằng 0.";
  } else if (salePrice != null && Number.isFinite(price) && salePrice > price) {
    errors.salePrice = "Giá khuyến mãi không được lớn hơn giá bán.";
  }
  if (
    (form.variants.length === 0 && form.stock.trim() === "") ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    errors.stock = "Tồn kho phải là số nguyên lớn hơn hoặc bằng 0.";
  }
  if (form.videoUrl.trim() && !isHttpUrl(form.videoUrl.trim())) {
    errors.videoUrl = "URL video phải bắt đầu bằng http:// hoặc https://.";
  }
  if (form.flashSaleEndsAt && Number.isNaN(new Date(form.flashSaleEndsAt).getTime())) {
    errors.flashSaleEndsAt = "Thời gian kết thúc không hợp lệ.";
  }

  if (form.specs.trim()) {
    try {
      const parsed: unknown = JSON.parse(form.specs);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        errors.specs = "Thông số phải là một JSON object.";
      } else {
        specs = parsed as Record<string, unknown>;
      }
    } catch {
      errors.specs = "JSON thông số không hợp lệ.";
    }
  }

  form.images.forEach((image) => {
    const url = image.url.trim();
    if (!url && image.alt.trim()) {
      errors[`image-${image.key}-url`] = "Cần nhập URL khi có mô tả ảnh.";
    } else if (url && !isHttpUrl(url)) {
      errors[`image-${image.key}-url`] = "URL ảnh phải bắt đầu bằng http:// hoặc https://.";
    }
  });

  form.variants.forEach((variant) => {
    const variantPrice = variant.price.trim() === "" ? null : Number(variant.price);
    const variantSalePrice = variant.salePrice.trim() === "" ? null : Number(variant.salePrice);
    const variantStock = Number(variant.stock);

    if (!variant.name.trim()) errors[`variant-${variant.key}-name`] = "Tên biến thể là bắt buộc.";
    if (variant.price.trim() && (!Number.isFinite(variantPrice) || (variantPrice ?? -1) < 0)) {
      errors[`variant-${variant.key}-price`] = "Giá biến thể không hợp lệ.";
    }
    if (
      variant.salePrice.trim() &&
      (!Number.isFinite(variantSalePrice) || (variantSalePrice ?? -1) < 0)
    ) {
      errors[`variant-${variant.key}-salePrice`] = "Giá khuyến mãi không hợp lệ.";
    } else if (
      variantSalePrice != null &&
      Number.isFinite(variantSalePrice) &&
      variantSalePrice > (variantPrice ?? price)
    ) {
      errors[`variant-${variant.key}-salePrice`] = "Giá khuyến mãi vượt quá giá áp dụng.";
    }
    if (variant.stock.trim() === "" || !Number.isInteger(variantStock) || variantStock < 0) {
      errors[`variant-${variant.key}-stock`] = "Tồn kho phải là số nguyên không âm.";
    }
  });

  return { errors, specs };
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-line p-4 sm:p-5">
      <legend className="px-1 text-base font-semibold text-ink">{title}</legend>
      {description && <p className="mb-4 text-sm text-muted">{description}</p>}
      {children}
    </fieldset>
  );
}

function ProductFormModal({
  productId,
  categories,
  brands,
  taxonomiesLoading,
  onClose,
  onSaved,
}: {
  productId: string | null;
  categories: CategoryOption[];
  brands: Brand[];
  taxonomiesLoading: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<ProductFormState>(createEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!productId) return;
    let ignore = false;
    setDetailLoading(true);
    setDetailError(null);

    api<AdminProduct>(`/api/v1/admin/products/${productId}`)
      .then((product) => {
        if (!ignore) setForm(formFromProduct(product));
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setDetailError(
            requestError instanceof Error
              ? requestError.message
              : "Không tải được thông tin sản phẩm.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setDetailLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [productId, reloadKey]);

  function clearError(key: string) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function setField<Key extends keyof ProductFormState>(
    key: Key,
    value: ProductFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    clearError(key);
  }

  function updateImage(key: string, field: "url" | "alt", value: string) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image) =>
        image.key === key ? { ...image, [field]: value } : image,
      ),
    }));
    clearError(`image-${key}-${field}`);
  }

  function updateVariant(
    key: string,
    field: Exclude<keyof VariantRow, "key" | "id" | "canDelete">,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.key === key ? { ...variant, [field]: value } : variant,
      ),
    }));
    clearError(`variant-${key}-${field}`);
    if (field === "stock") clearError("stock");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateForm(form);
    setErrors(validation.errors);
    setSubmitError(null);
    if (Object.keys(validation.errors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      description: nullableText(form.description),
      price: Number(form.price),
      salePrice: form.salePrice.trim() ? Number(form.salePrice) : null,
      stock: getEffectiveStock(form),
      sku: nullableText(form.sku),
      barcode: nullableText(form.barcode),
      categoryId: nullableText(form.categoryId),
      brandId: nullableText(form.brandId),
      status: form.status,
      isFeatured: form.isFeatured,
      isFlashSale: form.isFlashSale,
      flashSaleEndsAt: form.flashSaleEndsAt
        ? new Date(form.flashSaleEndsAt).toISOString()
        : null,
      videoUrl: nullableText(form.videoUrl),
      specs: validation.specs,
      images: form.images.flatMap((image) => {
        const url = image.url.trim();
        if (!url) return [];
        const alt = optionalText(image.alt);
        return [{ url, ...(alt ? { alt } : {}) }];
      }),
      variants: form.variants.map((variant) => {
        const sku = optionalText(variant.sku);
        const color = optionalText(variant.color);
        const size = optionalText(variant.size);
        const price = variant.price.trim() ? Number(variant.price) : undefined;
        const salePrice = variant.salePrice.trim() ? Number(variant.salePrice) : undefined;
        return {
          ...(productId && variant.id ? { id: variant.id } : {}),
          name: variant.name.trim(),
          ...(sku ? { sku } : {}),
          ...(color ? { color } : {}),
          ...(size ? { size } : {}),
          ...(price !== undefined ? { price } : {}),
          ...(salePrice !== undefined ? { salePrice } : {}),
          stock: Number(variant.stock),
        };
      }),
    };

    setSaving(true);
    try {
      if (productId) {
        await api(`/api/v1/admin/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Đã lưu thay đổi sản phẩm.");
      } else {
        await api("/api/v1/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Đã tạo sản phẩm mới.");
      }
      setSaving(false);
      onSaved();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Không thể lưu sản phẩm.";
      setSubmitError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={productId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
      className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto"
    >
      {detailLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted">
          <LoaderCircle className="h-7 w-7 animate-spin text-accent" aria-hidden />
          Đang tải dữ liệu mới nhất…
        </div>
      ) : detailError ? (
        <ErrorState message={detailError} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : (
        <form noValidate onSubmit={onSubmit} className="grid gap-5">
          <FormSection title="Thông tin cơ bản">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <Label htmlFor="product-name">Tên sản phẩm</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  error={Boolean(errors.name)}
                  aria-invalid={Boolean(errors.name)}
                  autoFocus={!productId}
                />
                <FieldError>{errors.name}</FieldError>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label htmlFor="product-description">Mô tả</Label>
                <Textarea
                  id="product-description"
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Mô tả ngắn về sản phẩm"
                />
              </div>
              <div>
                <Label htmlFor="product-category">Danh mục</Label>
                <Select
                  id="product-category"
                  value={form.categoryId}
                  disabled={taxonomiesLoading}
                  onChange={(event) => setField("categoryId", event.target.value)}
                >
                  <option value="">
                    {taxonomiesLoading ? "Đang tải danh mục…" : "Không chọn danh mục"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="product-brand">Thương hiệu</Label>
                <Select
                  id="product-brand"
                  value={form.brandId}
                  disabled={taxonomiesLoading}
                  onChange={(event) => setField("brandId", event.target.value)}
                >
                  <option value="">
                    {taxonomiesLoading ? "Đang tải thương hiệu…" : "Không chọn thương hiệu"}
                  </option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="product-status">Trạng thái</Label>
                <Select
                  id="product-status"
                  value={form.status}
                  onChange={(event) => setField("status", event.target.value)}
                >
                  {Object.entries(PRODUCT_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Giá và tồn kho">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label htmlFor="product-price">Giá bán</Label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                  error={Boolean(errors.price)}
                  aria-invalid={Boolean(errors.price)}
                />
                <FieldError>{errors.price}</FieldError>
              </div>
              <div>
                <Label htmlFor="product-sale-price">Giá khuyến mãi</Label>
                <Input
                  id="product-sale-price"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={form.salePrice}
                  onChange={(event) => setField("salePrice", event.target.value)}
                  error={Boolean(errors.salePrice)}
                  aria-invalid={Boolean(errors.salePrice)}
                />
                <FieldError>{errors.salePrice}</FieldError>
              </div>
              <div>
                <Label htmlFor="product-stock">Tồn kho</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={
                    form.variants.length > 0
                      ? String(getEffectiveStock(form))
                      : form.stock
                  }
                  disabled={form.variants.length > 0}
                  onChange={(event) => setField("stock", event.target.value)}
                  error={Boolean(errors.stock)}
                  aria-invalid={Boolean(errors.stock)}
                  aria-describedby={
                    form.variants.length > 0
                      ? "product-stock-helper"
                      : undefined
                  }
                />
                {form.variants.length > 0 && (
                  <p id="product-stock-helper" className="mt-1 text-xs text-muted">
                    Tồn kho sản phẩm được tính từ tổng tồn kho các biến thể.
                  </p>
                )}
                <FieldError>{errors.stock}</FieldError>
              </div>
              <div>
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  value={form.sku}
                  onChange={(event) => setField("sku", event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="product-barcode">Mã vạch</Label>
                <Input
                  id="product-barcode"
                  value={form.barcode}
                  onChange={(event) => setField("barcode", event.target.value)}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Hiển thị và khuyến mãi">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => setField("isFeatured", event.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Sản phẩm nổi bật
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.isFlashSale}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      isFlashSale: event.target.checked,
                      flashSaleEndsAt: event.target.checked ? current.flashSaleEndsAt : "",
                    }));
                    clearError("flashSaleEndsAt");
                  }}
                  className="h-4 w-4 accent-accent"
                />
                Flash sale
              </label>
              <div>
                <Label htmlFor="product-flash-end">Kết thúc flash sale</Label>
                <Input
                  id="product-flash-end"
                  type="datetime-local"
                  disabled={!form.isFlashSale}
                  value={form.flashSaleEndsAt}
                  onChange={(event) => setField("flashSaleEndsAt", event.target.value)}
                  error={Boolean(errors.flashSaleEndsAt)}
                  aria-invalid={Boolean(errors.flashSaleEndsAt)}
                />
                <FieldError>{errors.flashSaleEndsAt}</FieldError>
              </div>
              <div>
                <Label htmlFor="product-video-url">URL video</Label>
                <Input
                  id="product-video-url"
                  type="url"
                  placeholder="https://…"
                  value={form.videoUrl}
                  onChange={(event) => setField("videoUrl", event.target.value)}
                  error={Boolean(errors.videoUrl)}
                  aria-invalid={Boolean(errors.videoUrl)}
                />
                <FieldError>{errors.videoUrl}</FieldError>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Thông số kỹ thuật"
            description={'Nhập một JSON object, ví dụ: {"Màu sắc": "Đen", "Bảo hành": "12 tháng"}.'}
          >
            <Label htmlFor="product-specs">JSON thông số</Label>
            <Textarea
              id="product-specs"
              value={form.specs}
              onChange={(event) => setField("specs", event.target.value)}
              placeholder={'{\n  "Màu sắc": "Đen"\n}'}
              className="min-h-36 font-mono"
              spellCheck={false}
              error={Boolean(errors.specs)}
              aria-invalid={Boolean(errors.specs)}
            />
            <FieldError>{errors.specs}</FieldError>
          </FormSection>

          <FormSection title="Hình ảnh" description="Ảnh đầu tiên sẽ được dùng làm ảnh đại diện.">
            <div className="grid gap-3">
              {form.images.map((image, index) => {
                const urlError = errors[`image-${image.key}-url`];
                return (
                  <div
                    key={image.key}
                    className="grid gap-3 rounded-xl border border-line bg-subtle/40 p-3 sm:grid-cols-[5rem_1fr_1fr_auto] sm:items-start"
                  >
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
                      {image.url.trim() && isHttpUrl(image.url.trim()) ? (
                        <img
                          src={image.url.trim()}
                          alt={image.alt.trim() || `Xem trước ảnh ${index + 1}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ImageOff className="h-5 w-5 text-muted" aria-hidden />
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`image-url-${image.key}`}>URL ảnh {index + 1}</Label>
                      <Input
                        id={`image-url-${image.key}`}
                        type="url"
                        placeholder="https://…"
                        value={image.url}
                        onChange={(event) => updateImage(image.key, "url", event.target.value)}
                        error={Boolean(urlError)}
                        aria-invalid={Boolean(urlError)}
                      />
                      <FieldError>{urlError}</FieldError>
                    </div>
                    <div>
                      <Label htmlFor={`image-alt-${image.key}`}>Mô tả ảnh</Label>
                      <Input
                        id={`image-alt-${image.key}`}
                        value={image.alt}
                        onChange={(event) => updateImage(image.key, "alt", event.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          images: current.images.filter((item) => item.key !== image.key),
                        }))
                      }
                      aria-label={`Xóa ảnh ${index + 1}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger sm:mt-7"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-self-start"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    images: [...current.images, createImageRow()],
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden /> Thêm ảnh
              </Button>
            </div>
          </FormSection>

          <FormSection title="Biến thể" description="Tạo các lựa chọn riêng theo màu, kích thước hoặc SKU.">
            <div className="grid gap-3">
              {form.variants.length === 0 && (
                <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                  Chưa có biến thể.
                </p>
              )}
              {form.variants.map((variant, index) => (
                <div key={variant.key} className="rounded-xl border border-line bg-subtle/40 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Biến thể {index + 1}</p>
                    <button
                      type="button"
                      disabled={variant.id !== undefined && variant.canDelete === false}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          variants: current.variants.filter((item) => item.key !== variant.key),
                        }))
                      }
                      title={
                        variant.id !== undefined && variant.canDelete === false
                          ? "Đã phát sinh giao dịch; đặt tồn kho 0 thay vì xóa."
                          : undefined
                      }
                      aria-label={
                        variant.id !== undefined && variant.canDelete === false
                          ? `Không thể xóa biến thể ${index + 1}: đã phát sinh giao dịch; đặt tồn kho 0`
                          : `Xóa biến thể ${index + 1}`
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor={`variant-name-${variant.key}`}>Tên biến thể</Label>
                      <Input
                        id={`variant-name-${variant.key}`}
                        value={variant.name}
                        onChange={(event) => updateVariant(variant.key, "name", event.target.value)}
                        error={Boolean(errors[`variant-${variant.key}-name`])}
                        aria-invalid={Boolean(errors[`variant-${variant.key}-name`])}
                      />
                      <FieldError>{errors[`variant-${variant.key}-name`]}</FieldError>
                    </div>
                    <div>
                      <Label htmlFor={`variant-sku-${variant.key}`}>SKU</Label>
                      <Input
                        id={`variant-sku-${variant.key}`}
                        value={variant.sku}
                        onChange={(event) => updateVariant(variant.key, "sku", event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`variant-stock-${variant.key}`}>Tồn kho</Label>
                      <Input
                        id={`variant-stock-${variant.key}`}
                        type="number"
                        min={0}
                        step={1}
                        value={variant.stock}
                        onChange={(event) => updateVariant(variant.key, "stock", event.target.value)}
                        error={Boolean(errors[`variant-${variant.key}-stock`])}
                        aria-invalid={Boolean(errors[`variant-${variant.key}-stock`])}
                      />
                      <FieldError>{errors[`variant-${variant.key}-stock`]}</FieldError>
                    </div>
                    <div>
                      <Label htmlFor={`variant-color-${variant.key}`}>Màu sắc</Label>
                      <Input
                        id={`variant-color-${variant.key}`}
                        value={variant.color}
                        onChange={(event) => updateVariant(variant.key, "color", event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`variant-size-${variant.key}`}>Kích thước</Label>
                      <Input
                        id={`variant-size-${variant.key}`}
                        value={variant.size}
                        onChange={(event) => updateVariant(variant.key, "size", event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`variant-price-${variant.key}`}>Giá riêng</Label>
                      <Input
                        id={`variant-price-${variant.key}`}
                        type="number"
                        min={0}
                        step="any"
                        value={variant.price}
                        onChange={(event) => updateVariant(variant.key, "price", event.target.value)}
                        error={Boolean(errors[`variant-${variant.key}-price`])}
                        aria-invalid={Boolean(errors[`variant-${variant.key}-price`])}
                      />
                      <FieldError>{errors[`variant-${variant.key}-price`]}</FieldError>
                    </div>
                    <div>
                      <Label htmlFor={`variant-sale-${variant.key}`}>Giá khuyến mãi</Label>
                      <Input
                        id={`variant-sale-${variant.key}`}
                        type="number"
                        min={0}
                        step="any"
                        value={variant.salePrice}
                        onChange={(event) =>
                          updateVariant(variant.key, "salePrice", event.target.value)
                        }
                        error={Boolean(errors[`variant-${variant.key}-salePrice`])}
                        aria-invalid={Boolean(errors[`variant-${variant.key}-salePrice`])}
                      />
                      <FieldError>{errors[`variant-${variant.key}-salePrice`]}</FieldError>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-self-start"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    variants: [...current.variants, createVariantRow()],
                  }))
                }
              >
                <Plus className="h-4 w-4" aria-hidden /> Thêm biến thể
              </Button>
            </div>
          </FormSection>

          {Object.keys(errors).length > 0 && (
            <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              Vui lòng kiểm tra lại các trường được đánh dấu.
            </p>
          )}
          {submitError && (
            <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              {submitError}
            </p>
          )}
          <div className="flex flex-col-reverse justify-end gap-2 border-t border-line pt-4 sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" isLoading={saving}>
              {productId ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ProductThumbnail({ product, className = "h-12 w-12" }: { product: AdminProduct; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white ${className}`}>
      {product.images?.[0]?.url ? (
        <img
          src={product.images[0].url}
          alt={product.images[0].alt || product.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <ImageOff className="h-5 w-5 text-muted" aria-hidden />
      )}
    </div>
  );
}

function Price({ product }: { product: AdminProduct }) {
  return (
    <div>
      <p className="font-semibold text-accent">{formatCurrency(product.salePrice ?? product.price)}</p>
      {product.salePrice != null && (
        <p className="text-xs text-muted line-through">{formatCurrency(product.price)}</p>
      )}
    </div>
  );
}

function ProductListSkeleton() {
  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Tồn kho</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRowSkeleton key={index} cols={7} />
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-16 w-16 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function AdminProductsPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<AdminProduct> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [taxonomiesLoading, setTaxonomiesLoading] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestId = useRef(0);

  const page = parsePage(params.get("page"));
  const q = params.get("q")?.trim() ?? "";
  const status = params.get("status") ?? "";
  const categoryId = params.get("categoryId") ?? "";
  const brandId = params.get("brandId") ?? "";
  const stockStatus = params.get("stockStatus") ?? "";
  const requestedSort = params.get("sort");
  const sort = SORT_OPTIONS.some((option) => option.value === requestedSort)
    ? (requestedSort ?? DEFAULT_SORT)
    : DEFAULT_SORT;
  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);
  const hasFilters = FILTER_KEYS.some((key) => params.has(key));

  const patchFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      next.delete("page");
      setParams(next);
    },
    [params, setParams],
  );

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
    });
    if (q) query.set("q", q);
    if (status) query.set("status", status);
    if (categoryId) query.set("categoryId", categoryId);
    if (brandId) query.set("brandId", brandId);
    if (stockStatus) query.set("stockStatus", stockStatus);

    try {
      const data = await api<Paginated<AdminProduct>>(
        `/api/v1/admin/products?${query.toString()}`,
      );
      if (currentRequest === requestId.current) setResult(data);
    } catch (requestError) {
      if (currentRequest === requestId.current) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không tải được danh sách sản phẩm.",
        );
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [brandId, categoryId, page, q, sort, status, stockStatus]);

  const loadTaxonomies = useCallback(async () => {
    setTaxonomiesLoading(true);
    setTaxonomyError(null);
    try {
      const [categoryData, brandData] = await Promise.all([
        api<{ items: Category[] }>("/api/v1/categories", { auth: false }),
        api<{ items: Brand[] }>("/api/v1/brands", { auth: false }),
      ]);
      setCategories(categoryData.items);
      setBrands(brandData.items);
    } catch (requestError) {
      setTaxonomyError(
        requestError instanceof Error
          ? requestError.message
          : "Không tải được danh mục và thương hiệu.",
      );
    } finally {
      setTaxonomiesLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadTaxonomies();
  }, [loadTaxonomies]);

  useEffect(() => {
    setSearchInput(params.get("q") ?? "");
  }, [params]);

  useEffect(() => {
    if (params.get("create") !== "true") return;
    setEditingId(null);
    setFormOpen(true);
    const next = new URLSearchParams(params);
    next.delete("create");
    setParams(next, { replace: true });
  }, [params, setParams]);

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    patchFilters({ q: searchInput.trim() || null });
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    FILTER_KEYS.forEach((key) => next.delete(key));
    next.delete("page");
    setParams(next);
  }

  function onPageChange(nextPage: number) {
    const next = new URLSearchParams(params);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditingId(product.id);
    setFormOpen(true);
  }

  function openAction(product: AdminProduct, action: ProductAction) {
    setActionError(null);
    setPendingAction({ product, action });
  }

  function closeAction() {
    if (actionLoading) return;
    setPendingAction(null);
    setActionError(null);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (pendingAction.action === "restore") {
        await api(`/api/v1/admin/products/${pendingAction.product.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "ACTIVE" }),
        });
        toast.success("Đã khôi phục sản phẩm.");
      } else {
        await api(`/api/v1/admin/products/${pendingAction.product.id}`, {
          method: "DELETE",
        });
        toast.success("Đã ẩn sản phẩm.");
      }
      setPendingAction(null);
      void load();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Không thể cập nhật sản phẩm.";
      setActionError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  }

  const items = result?.items ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Sản phẩm</h1>
          <p className="text-sm text-muted">
            {result ? `${result.pagination.total} sản phẩm` : "Quản lý danh mục sản phẩm"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden /> Thêm sản phẩm
        </Button>
      </div>

      <Card className="mb-4 p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <form onSubmit={onSearchSubmit} className="flex gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm tên, SKU…"
              aria-label="Tìm sản phẩm theo tên hoặc SKU"
              icon={<Search className="h-4 w-4" aria-hidden />}
            />
            <Button type="submit" variant="secondary">
              Tìm
            </Button>
          </form>
          <Select
            value={status}
            onChange={(event) => patchFilters({ status: event.target.value || null })}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(PRODUCT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={categoryId}
            disabled={taxonomiesLoading}
            onChange={(event) => patchFilters({ categoryId: event.target.value || null })}
            aria-label="Lọc theo danh mục"
          >
            <option value="">{taxonomiesLoading ? "Đang tải danh mục…" : "Tất cả danh mục"}</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
          <Select
            value={brandId}
            disabled={taxonomiesLoading}
            onChange={(event) => patchFilters({ brandId: event.target.value || null })}
            aria-label="Lọc theo thương hiệu"
          >
            <option value="">
              {taxonomiesLoading ? "Đang tải thương hiệu…" : "Tất cả thương hiệu"}
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
          <Select
            value={stockStatus}
            onChange={(event) => patchFilters({ stockStatus: event.target.value || null })}
            aria-label="Lọc theo tồn kho"
          >
            <option value="">Tất cả tồn kho</option>
            {STOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) =>
              patchFilters({ sort: event.target.value === DEFAULT_SORT ? null : event.target.value })
            }
            aria-label="Sắp xếp sản phẩm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="ghost"
            disabled={!hasFilters}
            onClick={clearFilters}
            className="xl:col-start-6"
          >
            <X className="h-4 w-4" aria-hidden /> Xóa bộ lọc
          </Button>
        </div>
        {taxonomyError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {taxonomyError}{" "}
            <button
              type="button"
              onClick={() => void loadTaxonomies()}
              className="font-semibold underline underline-offset-2"
            >
              Thử lại
            </button>
          </p>
        )}
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <ProductListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description="Thử thay đổi bộ lọc hoặc tạo sản phẩm mới."
          action={
            hasFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden /> Thêm sản phẩm
              </Button>
            )
          }
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Giá</th>
                    <th className="px-4 py-3">Tồn kho</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Cập nhật</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((product) => (
                    <tr key={product.id} className="hover:bg-subtle/50">
                      <td className="px-4 py-3">
                        <div className="flex min-w-56 items-center gap-3">
                          <ProductThumbnail product={product} />
                          <div>
                            <p className="line-clamp-2 max-w-xs font-medium">{product.name}</p>
                            <p className="mt-0.5 text-xs text-muted">SKU: {product.sku || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{product.category?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Price product={product} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={product.stock === 0 ? "danger" : product.stock <= 5 ? "warning" : "neutral"}
                        >
                          {product.stock}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={PRODUCT_STATUS_TONE[product.status ?? "DRAFT"] ?? "neutral"}>
                          {PRODUCT_STATUS_LABEL[product.status ?? "DRAFT"] ?? product.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {formatDateTime(product.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            aria-label={`Sửa ${product.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          {product.status === "HIDDEN" ? (
                            <button
                              type="button"
                              onClick={() => openAction(product, "restore")}
                              aria-label={`Khôi phục ${product.name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-ok/10 hover:text-ok"
                            >
                              <RotateCcw className="h-4 w-4" aria-hidden />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAction(product, "hide")}
                              aria-label={`Ẩn ${product.name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                            >
                              <EyeOff className="h-4 w-4" aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-3 md:hidden">
            {items.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="flex gap-3">
                  <ProductThumbnail product={product} className="h-16 w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-semibold">{product.name}</p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {product.sku || "Không có SKU"} · {product.category?.name ?? "Chưa phân loại"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Price product={product} />
                      <Badge tone={PRODUCT_STATUS_TONE[product.status ?? "DRAFT"] ?? "neutral"}>
                        {PRODUCT_STATUS_LABEL[product.status ?? "DRAFT"] ?? product.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs">
                  <div>
                    <span className="text-muted">Tồn kho</span>
                    <p className="mt-0.5 font-semibold">{product.stock}</p>
                  </div>
                  <div>
                    <span className="text-muted">Cập nhật</span>
                    <p className="mt-0.5 font-medium">{formatDateTime(product.updatedAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(product)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Sửa
                  </Button>
                  {product.status === "HIDDEN" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openAction(product, "restore")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Khôi phục
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openAction(product, "hide")}
                      className="text-danger"
                    >
                      <EyeOff className="h-3.5 w-3.5" aria-hidden /> Ẩn
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {!error && !loading && result && result.pagination.totalPages > 1 && (
        <Pagination meta={result.pagination} onPageChange={onPageChange} className="mt-6" />
      )}

      {formOpen && (
        <ProductFormModal
          productId={editingId}
          categories={categoryOptions}
          brands={brands}
          taxonomiesLoading={taxonomiesLoading}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setEditingId(null);
            void load();
          }}
        />
      )}

      <Modal
        open={Boolean(pendingAction)}
        onClose={closeAction}
        title={pendingAction?.action === "restore" ? "Khôi phục sản phẩm" : "Ẩn sản phẩm"}
        className="max-w-md"
      >
        {pendingAction && (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-muted">
              {pendingAction.action === "restore"
                ? `Khôi phục “${pendingAction.product.name}” và chuyển trạng thái sang Đang bán?`
                : `Ẩn “${pendingAction.product.name}”? Sản phẩm sẽ được xóa mềm và có thể khôi phục sau.`}
            </p>
            {actionError && (
              <p role="alert" className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">
                {actionError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeAction} disabled={actionLoading}>
                Hủy
              </Button>
              <Button
                type="button"
                variant={pendingAction.action === "hide" ? "danger" : "primary"}
                isLoading={actionLoading}
                onClick={() => void confirmAction()}
              >
                {pendingAction.action === "restore" ? "Khôi phục" : "Ẩn sản phẩm"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
