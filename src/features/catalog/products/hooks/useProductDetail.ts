import { useState, useEffect, useCallback } from "react";
import { Product } from "../types/Product";
import { fetchProductById } from "../api/productApi";

export interface UseProductDetailOptions {
  enabled?: boolean;
}

export function useProductDetail(
  productId: string,
  initialProduct?: Product,
  branchId?: string | null,
  options?: UseProductDetailOptions,
) {
  const enabled = options?.enabled ?? true;
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      if (!initialProduct) {
        setIsLoading(true);
      }
      setError(null);
      const res = await fetchProductById(productId, branchId);
      if (res?.data) {
        setProduct(res.data);
      }
    } catch (err: any) {
      if (!initialProduct) {
        setError(err?.message || "Không thể tải chi tiết sản phẩm");
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId, branchId, initialProduct]);

  useEffect(() => {
    if (enabled) {
      loadData();
    }
  }, [enabled, loadData]);

  return { product, isLoading: !enabled || isLoading, error, refresh: loadData };
}
