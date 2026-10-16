import axios from "axios";
import { PaginationResult } from "@/common/types/Result";
import { Brand } from "../types/Brand";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchBrands(): Promise<PaginationResult<Brand[]>> {
  const res = await axios.get<PaginationResult<Brand[]>>(
    `${BASE_URL}/api/catalog/brands`,
  );
  return res.data;
}
