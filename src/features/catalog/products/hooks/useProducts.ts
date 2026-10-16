import { useState, useEffect, useCallback } from "react";
import { Product } from "../types/Product";
import { fetchProducts } from "../api/productApi";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchProducts();
      setProducts(res.data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { products, isLoading, error, refresh: loadData };
}
