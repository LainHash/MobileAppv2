import { useState, useEffect, useCallback } from "react";
import { OrderDetailResponse } from "../types/order";
import { fetchOrderById, cancelOrder as apiCancelOrder } from "../api/ordersApi";

export interface UseOrderDetailOptions {
  orderId?: string | null;
  enabled?: boolean;
}

export function useOrderDetail({
  orderId,
  enabled = true,
}: UseOrderDetailOptions) {
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (isPullRefresh = false) => {
      if (!enabled || !orderId) {
        setIsLoading(false);
        return;
      }

      try {
        if (isPullRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const res = await fetchOrderById(orderId);
        if (res.isSucceed && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || "Không thể tải chi tiết đơn hàng");
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
    [enabled, orderId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const cancel = useCallback(async (): Promise<boolean> => {
    if (!orderId) return false;

    try {
      setIsCancelling(true);
      setError(null);
      const res = await apiCancelOrder(orderId);
      if (res.isSucceed) {
        await loadData();
        return true;
      }
      setError(res.message || "Không thể hủy đơn hàng");
      return false;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi hủy đơn hàng",
      );
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, [orderId, loadData]);

  return {
    order,
    isLoading,
    isRefreshing,
    isCancelling,
    error,
    refresh,
    cancel,
  };
}
