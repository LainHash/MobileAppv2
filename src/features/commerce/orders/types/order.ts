export enum PreparationStatus {
  Pending = 0,
  Preparing = 1,
  Ready = 2,
  Served = 3,
  Cancelled = 4,
}

export type PreparationStatusString =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Served"
  | "Cancelled";

export enum OrderStatus {
  Draft = 0,
  Pending = 1,
  Confirmed = 2,
  Preparing = 3,
  Ready = 4,
  Served = 5,
  Delivering = 6,
  Completed = 7,
  Cancelled = 8,
}

export type OrderStatusString =
  | "Draft"
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Served"
  | "Delivering"
  | "Completed"
  | "Cancelled";

export enum OrderType {
  DineIn = 0,
  TakeAway = 1,
  Delivery = 2,
}

export type OrderTypeString = "DineIn" | "TakeAway" | "Delivery";

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  note?: string;
}

export interface CreateDeliveryOrderRequest {
  branchId: string;
  deliveryAddress: string;
  note?: string;
  deliveryFee?: number;
  items?: CreateOrderItemRequest[];
}

export interface ReportOrderRequest {
  subject?: string;
  message: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface PaymentQrResponse {
  provider: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferContent: string;
  qrCodeUrl: string;
  expiresAt: string;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal?: number;
  total?: number;
  note?: string;
  preparationStatus?: PreparationStatus | PreparationStatusString | number;
  product?: {
    id: string;
    name: string;
    unitPrice?: number;
    currency?: string;
    unitSymbol?: string;
    primaryImage?: {
      image?: {
        url?: string;
      };
    };
    images?: {
      isPrimary?: boolean;
      image?: {
        url?: string;
      };
    }[];
  };
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  customerId?: string;
  customerName?: string;
  employeeId?: string;
  employeeName?: string;
  branchId: string;
  branchCode?: string;
  restaurantTableId?: string;
  tableNumber?: string;
  status: OrderStatus | OrderStatusString | number;
  type: OrderType | OrderTypeString | number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  note?: string;
  deliveryAddress?: string;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailResponse extends OrderResponse {
  orderDetails?: OrderItemResponse[];
  orderItems?: OrderItemResponse[];
}

export interface DeliveryOrderCheckoutResponse {
  order: OrderDetailResponse;
  payment: PaymentQrResponse;
}

export interface OrderPaymentStatusResponse {
  id?: string;
  orderId?: string;
  orderCode: string;
  status: OrderStatus | OrderStatusString | number;
  isPaid: boolean;
  totalAmount: number;
  paidAt?: string;
}

export interface GetAllOrdersParams {
  branchId?: string | null;
  customerId?: string | null;
  status?: OrderStatus | OrderStatusString | number;
  type?: OrderType | OrderTypeString | number;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

/**
 * Normalizes status code/string to standard OrderStatus number
 */
export function normalizeOrderStatus(
  status: OrderStatus | OrderStatusString | number | undefined,
): OrderStatus {
  if (typeof status === "number") return status as OrderStatus;
  if (!status) return OrderStatus.Draft;

  switch (status.toString().toLowerCase()) {
    case "draft":
      return OrderStatus.Draft;
    case "pending":
      return OrderStatus.Pending;
    case "confirmed":
      return OrderStatus.Confirmed;
    case "preparing":
      return OrderStatus.Preparing;
    case "ready":
      return OrderStatus.Ready;
    case "served":
      return OrderStatus.Served;
    case "delivering":
      return OrderStatus.Delivering;
    case "completed":
      return OrderStatus.Completed;
    case "cancelled":
    case "canceled":
      return OrderStatus.Cancelled;
    default:
      return OrderStatus.Draft;
  }
}

/**
 * Normalizes type code/string to standard OrderType number
 */
export function normalizeOrderType(
  type: OrderType | OrderTypeString | number | undefined,
): OrderType {
  if (typeof type === "number") return type as OrderType;
  if (!type) return OrderType.Delivery;

  switch (type.toString().toLowerCase()) {
    case "dinein":
      return OrderType.DineIn;
    case "takeaway":
      return OrderType.TakeAway;
    case "delivery":
    default:
      return OrderType.Delivery;
  }
}

export function isDeliveryOrder(
  type: OrderType | OrderTypeString | number | undefined,
): boolean {
  return normalizeOrderType(type) === OrderType.Delivery;
}

/**
 * Returns human-readable label and display colors for an order status.
 */
export function getOrderStatusMeta(
  status: OrderStatus | OrderStatusString | number | undefined,
): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const norm = normalizeOrderStatus(status);

  switch (norm) {
    case OrderStatus.Draft:
      return {
        label: "Chờ thanh toán",
        color: "#D97706",
        bgColor: "#FEF3C7",
        icon: "💳",
      };
    case OrderStatus.Pending:
      return {
        label: "Chờ xác nhận",
        color: "#2563EB",
        bgColor: "#DBEAFE",
        icon: "⏳",
      };
    case OrderStatus.Confirmed:
      return {
        label: "Đã xác nhận",
        color: "#059669",
        bgColor: "#D1FAE5",
        icon: "📋",
      };
    case OrderStatus.Preparing:
      return {
        label: "Đang chuẩn bị",
        color: "#7C3AED",
        bgColor: "#EDE9FE",
        icon: "🍳",
      };
    case OrderStatus.Ready:
      return {
        label: "Món đã sẵn sàng",
        color: "#0D9488",
        bgColor: "#CCFBF1",
        icon: "🍱",
      };
    case OrderStatus.Served:
      return {
        label: "Đã lên món",
        color: "#0284C7",
        bgColor: "#E0F2FE",
        icon: "🍽️",
      };
    case OrderStatus.Delivering:
      return {
        label: "Đang giao hàng",
        color: "#6366F1",
        bgColor: "#EEF2FF",
        icon: "🛵",
      };
    case OrderStatus.Completed:
      return {
        label: "Hoàn thành",
        color: "#16A34A",
        bgColor: "#DCFCE7",
        icon: "✅",
      };
    case OrderStatus.Cancelled:
      return {
        label: "Đã hủy",
        color: "#DC2626",
        bgColor: "#FEE2E2",
        icon: "❌",
      };
    default:
      return {
        label: "Không xác định",
        color: "#6B7280",
        bgColor: "#F3F4F6",
        icon: "📦",
      };
  }
}

/**
 * Checks if an order can be cancelled by the user.
 * Only orders in Pending or Draft status are cancellable.
 */
export function canCancelOrder(
  status: OrderStatus | OrderStatusString | number | undefined,
): boolean {
  const norm = normalizeOrderStatus(status);
  return norm === OrderStatus.Pending || norm === OrderStatus.Draft;
}

/**
 * Returns label and colors for a dish preparation status.
 */
export function getPreparationStatusMeta(
  status: PreparationStatus | PreparationStatusString | number | undefined,
): { label: string; color: string; bg: string } | null {
  if (status === undefined || status === null) return null;
  const str = String(status).toLowerCase();
  if (str === "0" || str === "pending") {
    return { label: "Chờ chế biến", color: "#64748B", bg: "#F1F5F9" };
  }
  if (str === "1" || str === "preparing") {
    return { label: "Đang nấu", color: "#7C3AED", bg: "#EDE9FE" };
  }
  if (str === "2" || str === "ready") {
    return { label: "Đã xong", color: "#0D9488", bg: "#CCFBF1" };
  }
  if (str === "3" || str === "served") {
    return { label: "Đã lên món", color: "#0284C7", bg: "#E0F2FE" };
  }
  if (str === "4" || str === "cancelled") {
    return { label: "Đã hủy", color: "#DC2626", bg: "#FEE2E2" };
  }
  return null;
}
