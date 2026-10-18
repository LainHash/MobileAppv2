import axios from "axios";
import { Result, PaginationResult } from "@/common/types/Result";
import {
  CreateDeliveryOrderRequest,
  DeliveryOrderCheckoutResponse,
  GetAllOrdersParams,
  OrderDetailResponse,
  OrderPaymentStatusResponse,
  OrderResponse,
} from "../types/order";
import { getOrCreateSessionId } from "@/common/utils/sessionStorage";
import { getAuthToken } from "@/features/auth/utils/authStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface OrdersApiOptions {
  sessionId?: string | null;
  token?: string | null;
}

/**
 * Resolves authentication headers and session ID for order endpoints.
 */
async function buildOrderHeaders(options?: OrdersApiOptions) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 1. Session ID (for anonymous cart/order checkout support)
  const sessionId =
    options?.sessionId !== undefined
      ? options.sessionId
      : await getOrCreateSessionId();
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  // 2. Auth token (for registered users)
  const token =
    options?.token !== undefined ? options.token : await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Creates a delivery order and generates payment QR (VietQR / SePay).
 */
export async function checkoutOrder(
  payload: CreateDeliveryOrderRequest,
  options?: OrdersApiOptions,
): Promise<Result<DeliveryOrderCheckoutResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/checkout`;
  const res = await axios.post<Result<DeliveryOrderCheckoutResponse>>(
    url,
    payload,
    { headers },
  );
  return res.data;
}

/**
 * Fetches order list with optional pagination and filters.
 */
export async function fetchOrders(
  params?: GetAllOrdersParams,
  options?: OrdersApiOptions,
): Promise<PaginationResult<OrderResponse[]>> {
  const headers = await buildOrderHeaders(options);
  const searchParams = new URLSearchParams();

  if (params?.branchId) {
    searchParams.append("branchId", params.branchId);
  }
  if (params?.customerId) {
    searchParams.append("customerId", params.customerId);
  }
  if (params?.status !== undefined) {
    searchParams.append("status", String(params.status));
  }
  if (params?.type !== undefined) {
    searchParams.append("type", String(params.type));
  }
  if (params?.page) {
    searchParams.append("page", String(params.page));
  }
  if (params?.pageSize) {
    searchParams.append("pageSize", String(params.pageSize));
  }
  if (params?.keyword) {
    searchParams.append("keyword", params.keyword);
  }

  const query = searchParams.toString();
  const url = query
    ? `${BASE_URL}/api/sale/orders?${query}`
    : `${BASE_URL}/api/sale/orders`;

  const res = await axios.get<PaginationResult<OrderResponse[]>>(url, {
    headers,
  });
  return res.data;
}

/**
 * Fetches single order details by ID.
 */
export async function fetchOrderById(
  id: string,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}`;
  const res = await axios.get<Result<OrderDetailResponse>>(url, { headers });
  return res.data;
}

/**
 * Checks payment status for an order (used for VietQR polling).
 */
export async function fetchOrderPaymentStatus(
  id: string,
  options?: OrdersApiOptions,
): Promise<Result<OrderPaymentStatusResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}/payment-status`;
  const res = await axios.get<Result<OrderPaymentStatusResponse>>(url, {
    headers,
  });
  return res.data;
}

/**
 * Cancels an order.
 */
export async function cancelOrder(
  id: string,
  options?: OrdersApiOptions,
): Promise<Result<void>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}/cancel`;
  const res = await axios.post<Result<void>>(url, {}, { headers });
  return res.data;
}
