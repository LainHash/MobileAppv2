import axios from "axios";
import { PaginationResult } from "@/common/types/Result";
import { RestaurantTable } from "../types/Table";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchTablesByBranch(
  branchId: string,
  areaId?: string | null,
): Promise<PaginationResult<RestaurantTable[]>> {
  const params: Record<string, any> = { branchId };
  if (areaId) {
    params.areaId = areaId;
  }

  const res = await axios.get<PaginationResult<RestaurantTable[]>>(
    `${BASE_URL}/api/territory/restaurant-tables`,
    {
      params,
    },
  );
  return res.data;
}
