import { useState, useEffect, useCallback } from "react";
import { Area } from "../types/Area";
import { fetchAreasByBranch } from "../api/areaApi";

export function useAreas(branchId: string | null | undefined) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAreas = useCallback(async () => {
    if (!branchId) {
      setAreas([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchAreasByBranch(branchId);
      if (res.isSucceed && res.data) {
        setAreas(res.data);
      } else {
        setError(res.message || "Không thể tải danh sách khu vực.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Lỗi tải danh sách khu vực.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  return {
    areas,
    isLoading,
    error,
    refresh: loadAreas,
  };
}
