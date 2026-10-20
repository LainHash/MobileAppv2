import { useState, useEffect, useCallback } from "react";
import { ReservationDetail } from "../types/Reservation";
import { fetchMyReservationById } from "../api/reservationApi";

export function useReservationDetail(id: string | null | undefined) {
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) {
      setReservation(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchMyReservationById(id);
      if (res.isSucceed && res.data) {
        setReservation(res.data);
      } else {
        setError(res.message || "Không thể tải chi tiết đặt bàn.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Lỗi tải chi tiết đặt bàn.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  return {
    reservation,
    isLoading,
    error,
    refresh: loadDetail,
  };
}
