import type { BadgeTone } from "../components/ui/Badge";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang đóng gói",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

export const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING_CONFIRMATION: "warning",
  CONFIRMED: "info",
  PACKING: "info",
  SHIPPING: "accent",
  COMPLETED: "ok",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  PAID: "ok",
  FAILED: "danger",
  REFUNDED: "neutral",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  CARD: "Thẻ",
  EWALLET: "Ví điện tử",
  OTHER: "Khác",
};

export const PRODUCT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang bán",
  HIDDEN: "Đã ẩn",
  OUT_OF_STOCK: "Hết hàng",
};

export const PRODUCT_STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  ACTIVE: "ok",
  HIDDEN: "neutral",
  OUT_OF_STOCK: "danger",
};

export const ORDER_STATUS_FLOW = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PACKING",
  "SHIPPING",
  "COMPLETED",
] as const;

export function orderLabel(status: string) {
  return ORDER_STATUS_LABEL[status] ?? status;
}

export function orderTone(status: string): BadgeTone {
  return ORDER_STATUS_TONE[status] ?? "neutral";
}

export function paymentLabel(status: string) {
  return PAYMENT_STATUS_LABEL[status] ?? status;
}

export function paymentTone(status: string): BadgeTone {
  return PAYMENT_STATUS_TONE[status] ?? "neutral";
}
