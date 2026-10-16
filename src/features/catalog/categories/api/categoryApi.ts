// src/features/catalog/product-categories/api/categoryApi.ts
import axios from "axios";
import { PaginationResult } from "@/common/types/Result";
import { ProductCategory } from "../types/Category";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchCategories(): Promise<
  PaginationResult<ProductCategory[]>
> {
  const res = await axios.get<PaginationResult<ProductCategory[]>>(
    `${BASE_URL}/api/catalog/categories`,
  );
  return res.data;
}
