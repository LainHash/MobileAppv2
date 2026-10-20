import axios from "axios";
import { PaginationResult } from "@/common/types/Result";
import { RestaurantTable } from "../types/Table";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchTablesByBranch(
  branchId: string,
): Promise<PaginationResult<RestaurantTable[]>> {
  const res = await axios.get<PaginationResult<RestaurantTable[]>>(
    `${BASE_URL}/api/territory/restaurant-tables`,
    {
      params: { branchId },
    },
  );
  return res.data;
}
