import { useState, useEffect, useCallback } from "react";
import { RestaurantTable } from "../types/Table";
import { fetchTablesByBranch } from "../api/tableApi";

export function useTables(
  branchId: string | null | undefined,
  areaId?: string | null | undefined,
) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    if (!branchId) {
      setTables([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchTablesByBranch(branchId, areaId);
      if (res.isSucceed && res.data) {
        setTables(res.data);
      } else {
        setError(res.message || "Không thể tải danh sách bàn.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Lỗi tải danh sách bàn.");
    } finally {
      setIsLoading(false);
    }
  }, [branchId, areaId]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  return {
    tables,
    isLoading,
    error,
    refresh: loadTables,
  };
}
