import { useState, useEffect, useCallback } from "react";
import { fetchHomeData } from "../api/homeApi";

import { Category } from "@/features/catalog/categories";
import { Branch } from "@/features/territory/branches";
import { Product } from "@/features/catalog/products";

export interface UseHomeOptions {
  enabled?: boolean;
}

export function useHome(branchId?: string | null, options?: UseHomeOptions) {
  const enabled = options?.enabled ?? true;
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (customBranchId?: string | null) => {
      try {
        setIsLoading(true);
        setError(null);
        const targetBranchId =
          customBranchId !== undefined ? customBranchId : branchId;
        const res = await fetchHomeData(targetBranchId);
        setCategories(res.data.productCategories ?? []);
        setBranches(res.data.branches ?? []);
        setProducts(res.data.products ?? []);
        setRecommendedProducts(
          res.data.recommendedProducts ?? res.data.recommendedProduct ?? [],
        );
        setPopularProducts(res.data.popularProducts ?? []);
      } catch (err: any) {
        setError(err?.message || "Không thể tải thông tin");
      } finally {
        setIsLoading(false);
      }
    },
    [branchId],
  );

  useEffect(() => {
    if (enabled) {
      loadData();
    }
  }, [enabled, loadData]);

  return {
    categories,
    branches,
    products,
    recommendedProducts,
    popularProducts,
    isLoading: !enabled || isLoading,
    error,
    refresh: loadData,
  };
}
