import axios from "axios";
import { PaginationResult } from "@/common/types/Result";
import { Area } from "../types/Area";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchAreasByBranch(
  branchId: string,
): Promise<PaginationResult<Area[]>> {
  const res = await axios.get<PaginationResult<Area[]>>(
    `${BASE_URL}/api/territory/areas`,
    {
      params: { branchId },
    },
  );
  return res.data;
}
