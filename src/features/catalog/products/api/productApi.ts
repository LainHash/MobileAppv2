import { PaginationResult, Result } from "@/common/types/Result";
import axios from "axios";
import { Product } from "../types/Product";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface ProductApiProps {
  categoryId?: string | null;
  brandId?: string | null;
  branchId?: string | null;
}

function buildQuery(props?: ProductApiProps): string {
  const params = new URLSearchParams();
  if (props?.categoryId) {
    params.append("categoryId", props.categoryId);
  }
  if (props?.brandId) {
    params.append("brandId", props.brandId);
  }
  if (props?.branchId) {
    params.append("branchId", props.branchId);
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



