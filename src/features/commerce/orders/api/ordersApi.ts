import axios from "axios";
import { Result, PaginationResult } from "@/common/types/Result";
import {
  CreateDeliveryOrderRequest,
  DeliveryOrderCheckoutResponse,
  GetAllOrdersParams,
  OrderDetailResponse,
  OrderPaymentStatusResponse,
  OrderResponse,
  OrderStatus,
  PreparationStatus,
} from "../types/order";
import { getOrCreateSessionId } from "@/common/utils/sessionStorage";
import { getAuthToken } from "@/features/auth/utils/authStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface OrdersApiOptions {
  sessionId?: string | null;
  token?: string | null;
}

async function buildOrderHeaders(options?: OrdersApiOptions) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const sessionId =
    options?.sessionId !== undefined
      ? options.sessionId
      : await getOrCreateSessionId();
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  const token =
    options?.token !== undefined ? options.token : await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

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

export async function fetchMyOrders(
  params?: GetAllOrdersParams,
  options?: OrdersApiOptions,
): Promise<PaginationResult<OrderResponse[]>> {
  const headers = await buildOrderHeaders(options);
  const searchParams = new URLSearchParams();

  if (params?.branchId) {
    searchParams.append("branchId", params.branchId);
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
    ? `${BASE_URL}/api/sale/orders/mine?${query}`
    : `${BASE_URL}/api/sale/orders/mine`;

  const res = await axios.get<PaginationResult<OrderResponse[]>>(url, {
    headers,
  });
  return res.data;
}

export async function fetchOrders(
  params?: GetAllOrdersParams,
  options?: OrdersApiOptions,
): Promise<PaginationResult<OrderResponse[]>> {
  const token =
    options?.token !== undefined ? options.token : await getAuthToken();
  if (token) {
    return fetchMyOrders(params, options);
  }

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

export async function fetchMyOrderById(
  id: string,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}/mine`;
  const res = await axios.get<Result<OrderDetailResponse>>(url, { headers });
  return res.data;
}

export async function fetchOrderById(
  id: string,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const token =
    options?.token !== undefined ? options.token : await getAuthToken();
  if (token) {
    try {
      return await fetchMyOrderById(id, options);
    } catch {
      // Fallback to general order endpoint if /mine returns error
    }
  }

  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}`;
  const res = await axios.get<Result<OrderDetailResponse>>(url, { headers });
  return res.data;
}

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

export async function cancelOrder(
  id: string,
  options?: OrdersApiOptions,
): Promise<Result<void>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}/cancel`;
  const res = await axios.post<Result<void>>(url, {}, { headers });
  return res.data;
}

export async function advanceOrderStatus(
  id: string,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}/advance-status`;
  const res = await axios.post<Result<OrderDetailResponse>>(url, {}, { headers });
  return res.data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${id}/status`;
  const res = await axios.patch<Result<OrderDetailResponse>>(
    url,
    { status },
    { headers },
  );
  return res.data;
}

export async function advanceItemPreparation(
  orderId: string,
  itemId: string,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${orderId}/items/${itemId}/advance-preparation`;
  const res = await axios.post<Result<OrderDetailResponse>>(url, {}, { headers });
  return res.data;
}

export async function updateItemPreparationStatus(
  orderId: string,
  itemId: string,
  status: PreparationStatus | number,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${orderId}/items/${itemId}/preparation-status`;
  const res = await axios.patch<Result<OrderDetailResponse>>(
    url,
    { status },
    { headers },
  );
  return res.data;
}

export async function cancelOrderItem(
  orderId: string,
  itemId: string,
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${orderId}/items/${itemId}/cancel`;
  const res = await axios.post<Result<OrderDetailResponse>>(url, {}, { headers });
  return res.data;
}

export async function batchUpdateItemPreparationStatus(
  orderId: string,
  status: PreparationStatus | number,
  itemIds?: string[],
  options?: OrdersApiOptions,
): Promise<Result<OrderDetailResponse>> {
  const headers = await buildOrderHeaders(options);
  const url = `${BASE_URL}/api/sale/orders/${orderId}/preparation-status/batch`;
  const res = await axios.post<Result<OrderDetailResponse>>(
    url,
    { status, itemIds },
    { headers },
  );
  return res.data;
}
