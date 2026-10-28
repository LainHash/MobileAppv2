import { useState, useEffect, useCallback, useRef } from "react";
import { Product } from "../types/Product";
import { fetchProducts, ProductApiProps } from "../api/productApi";

export function useProducts(filters?: ProductApiProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(filters?.page ?? 1);
  const [pageSize, setPageSize] = useState<number>(filters?.pageSize ?? 12);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const categoryId = filters?.categoryId;
  const branchId = filters?.branchId;
  const type = filters?.type;
  const filterType = filters?.filterType;
  const keyword = filters?.keyword;

  // Track filter changes to reset page to 1
  const prevFilterRef = useRef<string>("");
  const currentFilterKey = `${categoryId ?? ""}_${branchId ?? ""}_${type ?? ""}_${filterType ?? ""}`;

  useEffect(() => {
    if (prevFilterRef.current && prevFilterRef.current !== currentFilterKey) {
      setPage(1);
    }
    prevFilterRef.current = currentFilterKey;
  }, [currentFilterKey]);

  const loadData = useCallback(
    async (targetPage?: number) => {
      try {
        setIsLoading(true);
        setError(null);
        const activePage = targetPage ?? page;
        const res = await fetchProducts({
          categoryId,
          branchId,
          type,
          filterType,
          keyword,
          page: activePage,
          pageSize,
        });

        if (res?.data) {
          setProducts(res.data);
          setTotalItems(res.totalItems || res.data.length);
          setTotalPages(
            res.totalPages || Math.ceil((res.totalItems || res.data.length) / pageSize) || 1,
          );
        } else {
          setProducts([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (err: any) {
        setError(err?.message || "Không thể tải sản phẩm");
      } finally {
        setIsLoading(false);
      }
    },
    [categoryId, branchId, type, filterType, keyword, page, pageSize],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    products,
    isLoading,
    error,
    page,
    setPage: changePage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    refresh: () => loadData(page),
  };
}
