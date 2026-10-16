import axios from "axios";
import { PaginationResult } from "@/common/types/Result";
import { Category } from "../types/Category";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchCategories(): Promise<PaginationResult<Category[]>> {
  const res = await axios.get<PaginationResult<Category[]>>(
    `${BASE_URL}/api/catalog/categories`,
  );
  return res.data;
}
