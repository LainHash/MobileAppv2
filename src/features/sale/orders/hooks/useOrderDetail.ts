import { useState, useEffect, useCallback } from "react";
import { OrderDetailResponse, ReportOrderRequest } from "../types/order";
import {
  fetchOrderById,
  cancelOrder as apiCancelOrder,
  confirmDeliveryReceived as apiConfirmDeliveryReceived,
  reportOrder as apiReportOrder,
} from "../api/ordersApi";
import { useOrderRealtime } from "./useOrderRealtime";
import {
  OrderPreparationRealtimeEvent,
  BatchPreparationRealtimeEvent,
  OrderSyncedRealtimeEvent,
} from "../api/kitchenHub.service";

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
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState<boolean>(false);
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemStatusChanged = useCallback(
    (event: OrderPreparationRealtimeEvent) => {
      setOrder((prev) => {
        if (!prev) return prev;
        const updateList = (list?: any[]) =>
          list?.map((item) =>
            item.id === event.orderItemId
              ? { ...item, preparationStatus: event.newStatus }
              : item,
          );

        return {
          ...prev,
          orderDetails: updateList(prev.orderDetails),
          orderItems: updateList(prev.orderItems),
        };
      });
    },
    [],
  );

  const handleBatchStatusChanged = useCallback(
    (event: BatchPreparationRealtimeEvent) => {
      setOrder((prev) => {
        if (!prev) return prev;
        const itemIdsSet = new Set(event.itemIds);
        const updateList = (list?: any[]) =>
          list?.map((item) =>
            itemIdsSet.has(item.id)
              ? { ...item, preparationStatus: event.status }
              : item,
          );

        return {
          ...prev,
          orderDetails: updateList(prev.orderDetails),
          orderItems: updateList(prev.orderItems),
        };
      });
    },
    [],
  );

  const handleOrderSynced = useCallback(
    (event: OrderSyncedRealtimeEvent) => {
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: event.status,
        };
      });
    },
    [],
  );

  const { isConnected } = useOrderRealtime({
    orderId,
    enabled: Boolean(enabled && orderId),
    onItemStatusChanged: handleItemStatusChanged,
    onBatchStatusChanged: handleBatchStatusChanged,
    onOrderSynced: handleOrderSynced,
  });

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

  const confirmDelivery = useCallback(async (): Promise<boolean> => {
    if (!orderId) return false;

    try {
      setIsConfirmingDelivery(true);
      setError(null);
      const res = await apiConfirmDeliveryReceived(orderId);
      if (res.isSucceed) {
        if (res.data) {
          setOrder(res.data);
        } else {
          await loadData();
        }
        return true;
      }
      setError(res.message || "Không thể xác nhận đã nhận hàng");
      return false;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi xác nhận đã nhận hàng",
      );
      return false;
    } finally {
      setIsConfirmingDelivery(false);
    }
  }, [orderId, loadData]);

  const report = useCallback(
    async (payload: ReportOrderRequest): Promise<boolean> => {
      if (!orderId) return false;

      try {
        setIsReporting(true);
        setError(null);
        const res = await apiReportOrder(orderId, payload);
        if (res.isSucceed) {
          return true;
        }
        setError(res.message || "Không thể gửi khiếu nại");
        return false;
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Có lỗi xảy ra khi gửi khiếu nại",
        );
        return false;
      } finally {
        setIsReporting(false);
      }
    },
    [orderId],
  );

  return {
    order,
    isLoading,
    isRefreshing,
    isCancelling,
    isConfirmingDelivery,
    isReporting,
    error,
    isRealtimeConnected: isConnected,
    refresh,
    cancel,
    confirmDelivery,
    report,
  };
}

