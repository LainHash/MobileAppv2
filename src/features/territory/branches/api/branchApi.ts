import axios from "axios";
import { PaginationResult } from "@/common/types/Result";
import { Branch } from "../types/Branch";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchBranches(): Promise<PaginationResult<Branch[]>> {
  const res = await axios.get<PaginationResult<Branch[]>>(
    `${BASE_URL}/api/territory/branches`,
  );
  return res.data;
}
