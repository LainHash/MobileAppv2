import { PaginationResult } from "@/common/types/Result";
import axios from "axios";
import { Product } from "../types/Product";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchProducts(): Promise<PaginationResult<Product[]>> {
  const res = await axios.get<PaginationResult<Product[]>>(
    `${BASE_URL}/api/catalog/products`,
  );
  return res.data;
}
