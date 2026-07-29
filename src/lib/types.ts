export type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  children?: Category[];
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};

export type ProductImage = { id?: string; url: string; alt?: string | null; sortOrder?: number };

export type ProductVariant = {
  id: string;
  name: string;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
  price?: number | null;
  salePrice?: number | null;
  stock: number;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  sku?: string | null;
  status?: string;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  flashSaleEndsAt?: string | null;
  soldCount?: number;
  viewCount?: number;
  category?: { id: string; name: string; slug: string } | null;
  brand?: { id: string; name: string; slug: string; logoUrl?: string | null } | null;
  images?: ProductImage[];
  reviewCount?: number;
};

export type ReviewUser = { id: string; fullName: string; avatarUrl?: string | null };

export type Review = {
  id: string;
  rating: number;
  content?: string | null;
  images?: unknown;
  videoUrl?: string | null;
  createdAt: string;
  user: ReviewUser;
};

export type ProductQuestion = {
  id: string;
  question: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  user: { id: string; fullName: string };
};

export type ProductDetail = ProductSummary & {
  specs?: Record<string, string> | null;
  barcode?: string | null;
  videoUrl?: string | null;
  variants: ProductVariant[];
  ratingAverage: number;
  ratingCount: number;
  reviews: Review[];
  questions: ProductQuestion[];
  related: ProductSummary[];
};

export type CartLineItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  name: string;
  slug: string;
  image?: string | null;
  variantName?: string | null;
  unitPrice: number;
  lineTotal: number;
  stock: number;
};

export type Cart = {
  id: string;
  items: CartLineItem[];
  subtotal: number;
  itemCount: number;
};

export type ShippingMethod = {
  id: string;
  name: string;
  code: string;
  fee: number;
  estimatedDays: number;
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
  createdAt: string;
};

export type OrderItemDetail = {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

export type OrderStatusEvent = {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  note?: string | null;
  shipFullName: string;
  shipPhone: string;
  shipLine1: string;
  shipLine2?: string | null;
  shipWard?: string | null;
  shipDistrict?: string | null;
  shipCity: string;
  shipCountry: string;
  items: OrderItemDetail[];
  statusHistory: OrderStatusEvent[];
  createdAt: string;
  updatedAt: string;
  refundRequestedAt?: string | null;
};

export type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image?: string | null;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type AuthUserDto = {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  status: string;
  avatarUrl?: string | null;
};

export type DashboardData = {
  kpis: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  lowStock: { id: string; name: string; sku?: string | null; stock: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: { fullName: string; email: string };
  }[];
  salesByDay: { day: string; total: number; count: number }[];
};

export type AdminProduct = ProductSummary & {
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
};
