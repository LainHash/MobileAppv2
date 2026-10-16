import { useState, useEffect, useCallback } from "react";
import { Branch } from "../types/Branch";
import { fetchBranches } from "../api/branchApi";

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchBranches();
      setBranches(res.data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải chi nhánh");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { branches, isLoading, error, refresh: loadData };
}
