// src/features/catalog/product-categories/hooks/useCategories.ts
import { useState, useEffect, useCallback } from "react";
import { ProductCategory } from "../types/Category";
import { fetchCategories } from "../api/categoryApi";

export function useCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchCategories();
      setCategories(res.data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh mục");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { categories, isLoading, error, refresh: loadData };
}
