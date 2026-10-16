import { useState, useEffect, useCallback } from "react";
import { Brand } from "../types/Brand";
import { fetchBrands } from "../api/brandApi";

export function useBrands() {
  const [brands, setBrand] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchBrands();
      setBrand(res.data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải hãng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { brands, isLoading, error, refresh: loadData };
}
