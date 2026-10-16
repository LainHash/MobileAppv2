import { useState, useEffect, useCallback } from "react";
import { Home } from "../types/Home";
import { fetchHomeData } from "../api/homeApi";
import { Brand } from "@/features/catalog/brands";
import { Category } from "@/features/catalog/categories";
import { Branch } from "@/features/territory/branches";
import { Product } from "@/features/catalog/products";

export function useHome() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchHomeData();
      setBrands(res.data.brands);
      setCategories(res.data.productCategories);
      setBranches(res.data.branches);
      setProducts(res.data.products);
    } catch (err: any) {
      setError(err?.message || "Không thể tải thông tin");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    brands,
    categories,
    branches,
    products,
    isLoading,
    error,
    refresh: loadData,
  };
}
