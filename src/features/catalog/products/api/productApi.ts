import { PaginationResult, Result } from "@/common/types/Result";
import axios from "axios";
import { Product } from "../types/Product";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface ProductApiProps {
  categoryId?: string | null;
  branchId?: string | null;
  page?: number;
  pageSize?: number;
  type?: "default" | "recommended" | "trending" | string | null;
  filterType?: "Default" | "Recommended" | "Trending" | string | null;
  keyword?: string | null;
}

function buildQuery(props?: ProductApiProps): string {
  const params = new URLSearchParams();
  if (props?.categoryId) {
    params.append("categoryId", props.categoryId);
  }
  if (props?.branchId) {
    params.append("branchId", props.branchId);
  }
  if (props?.page) {
    params.append("page", props.page.toString());
  }
  if (props?.pageSize) {
    params.append("pageSize", props.pageSize.toString());
  }
  if (props?.type && props.type !== "default") {
    params.append("type", props.type);
  }
  if (props?.filterType && props.filterType !== "Default") {
    params.append("filterType", props.filterType);
  }
  if (props?.keyword) {
    params.append("keyword", props.keyword);
  }
  return params.toString();
}

export async function fetchProducts(
  props?: ProductApiProps,
): Promise<PaginationResult<Product[]>> {
  const query = buildQuery(props);
  const url = query
    ? `${BASE_URL}/api/catalog/products?${query}`
    : `${BASE_URL}/api/catalog/products`;
  const res = await axios.get<PaginationResult<Product[]>>(url);
  return res.data;
}

export async function fetchProductById(
  id: string,
  branchId?: string | null,
): Promise<Result<Product>> {
  const params = new URLSearchParams();
  if (branchId) {
    params.append("branchId", branchId);
  }
  const query = params.toString();
  const url = query
    ? `${BASE_URL}/api/catalog/products/${id}?${query}`
    : `${BASE_URL}/api/catalog/products/${id}`;
  const res = await axios.get<Result<Product>>(url);
  return res.data;
}
