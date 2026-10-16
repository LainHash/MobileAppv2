import { useState, useEffect, useCallback } from "react";
import { Product } from "../types/Product";
import { fetchProducts, ProductApiProps } from "../api/productApi";

export function useProducts(filters?: ProductApiProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const categoryId = filters?.categoryId;
  const brandId = filters?.brandId;
  const branchId = filters?.branchId;

  const loadData = useCallback(
    async (customFilters?: ProductApiProps) => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetchProducts(
          customFilters ?? { categoryId, brandId, branchId },
        );
        setProducts(res.data);
      } catch (err: any) {
        setError(err?.message || "Không thể tải sản phẩm");
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId, brandId, branchId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { products, isLoading, error, refresh: loadData };
}
