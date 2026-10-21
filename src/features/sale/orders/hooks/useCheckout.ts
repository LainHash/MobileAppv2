import { useState, useCallback } from "react";
import {
  CreateDeliveryOrderRequest,
  DeliveryOrderCheckoutResponse,
} from "../types/order";
import { checkoutOrder } from "../api/ordersApi";

export function useCheckout() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitOrder = useCallback(
    async (
      payload: CreateDeliveryOrderRequest,
    ): Promise<DeliveryOrderCheckoutResponse | null> => {
      try {
        setIsSubmitting(true);
        setError(null);

        const res = await checkoutOrder(payload);
        if (res.isSucceed && res.data) {
          return res.data;
        }

        const msg = res.message || "Không thể hoàn tất đơn hàng";
        setError(msg);
        return null;
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.";
        setError(errorMsg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    isSubmitting,
    error,
    setError,
    submitOrder,
  };
}
