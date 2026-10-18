import { useState, useEffect, useRef, useCallback } from "react";
import { OrderPaymentStatusResponse } from "../types/order";
import { fetchOrderPaymentStatus } from "../api/ordersApi";

export interface UsePaymentStatusPollingOptions {
  orderId?: string | null;
  enabled?: boolean;
  intervalMs?: number;
  maxAttempts?: number;
  onPaymentSuccess?: (status: OrderPaymentStatusResponse) => void;
}

export function usePaymentStatusPolling({
  orderId,
  enabled = true,
  intervalMs = 3500,
  maxAttempts = 120, // ~7 minutes maximum polling
  onPaymentSuccess,
}: UsePaymentStatusPollingOptions) {
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] =
    useState<OrderPaymentStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);

  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
  }, [onPaymentSuccess]);

  const checkStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      const res = await fetchOrderPaymentStatus(orderId);
      if (res.isSucceed && res.data) {
        setPaymentStatus(res.data);
        if (res.data.isPaid) {
          setIsPaid(true);
          setIsPolling(false);
          onPaymentSuccessRef.current?.(res.data);
          return true;
        }
      }
    } catch (err: any) {
      // Don't kill polling on transient network hiccup
      setError(err?.message || "Lỗi kiểm tra trạng thái");
    }
    return false;
  }, [orderId]);

  useEffect(() => {
    if (!enabled || !orderId || isPaid) {
      setIsPolling(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setIsPolling(true);
    attemptsRef.current = 0;

    // Check immediately once
    checkStatus();

    // Set up recurring interval
    timerRef.current = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current >= maxAttempts) {
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      const paid = await checkStatus();
      if (paid && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, orderId, isPaid, intervalMs, maxAttempts, checkStatus]);

  const checkNow = useCallback(async () => {
    return await checkStatus();
  }, [checkStatus]);

  return {
    isPaid,
    paymentStatus,
    isPolling,
    error,
    checkNow,
  };
}
