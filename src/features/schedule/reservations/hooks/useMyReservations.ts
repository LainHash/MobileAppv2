import { useState, useEffect, useCallback } from "react";
import { Reservation } from "../types/Reservation";
import { fetchMyReservations } from "../api/reservationApi";
import { useAuthContext } from "@/features/auth";

export function useMyReservations() {
  const { isAuthenticated } = useAuthContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    if (!isAuthenticated) {
      setReservations([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchMyReservations();
      if (res.isSucceed && res.data) {
        setReservations(res.data);
      } else {
        setError(res.message || "Không thể tải danh sách đặt bàn.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Lỗi tải danh sách đặt bàn.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  return {
    reservations,
    isLoading,
    error,
    refresh: loadReservations,
  };
}
