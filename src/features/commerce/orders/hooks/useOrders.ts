import { useState, useEffect, useCallback } from "react";
import { OrderResponse, GetAllOrdersParams, OrderStatus } from "../types/order";
import { fetchOrders } from "../api/ordersApi";

export interface UseOrdersOptions {
  branchId?: string | null;
  status?: OrderStatus | number;
  enabled?: boolean;
}

export function useOrders(options?: UseOrdersOptions) {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;
  const branchId = options?.branchId;
  const status = options?.status;

  const loadData = useCallback(
    async (isPullRefresh = false) => {
      if (!enabled) return;

      try {
        if (isPullRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const params: GetAllOrdersParams = {
          branchId,
          status,
          pageSize: 50,
        };

        const res = await fetchOrders(params);
        if (res.isSucceed) {
          setOrders(res.data ?? []);
          setTotalItems(res.totalItems ?? res.data?.length ?? 0);
        } else {
          setError(res.message || "Không thể tải danh sách đơn hàng");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể kết nối đến máy chủ",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [enabled, branchId, status],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    orders,
    totalItems,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
