import axios from "axios";
import { PaginationResult, Result } from "@/common/types/Result";
import { Branch, OptimalBranchResponse } from "../types/Branch";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function fetchBranches(): Promise<PaginationResult<Branch[]>> {
  const res = await axios.get<PaginationResult<Branch[]>>(
    `${BASE_URL}/api/territory/branches`,
  );
  return res.data;
}

export async function fetchOptimalBranch(
  latitude: number,
  longitude: number,
  maxDeliveryRadiusKm: number = 15.0,
  targetBranchId?: string | null,
): Promise<Result<OptimalBranchResponse>> {
  const res = await axios.get<Result<OptimalBranchResponse>>(
    `${BASE_URL}/api/territory/branches/optimal`,
    {
      params: {
        latitude,
        longitude,
        maxDeliveryRadiusKm,
        ...(targetBranchId ? { targetBranchId } : {}),
      },
    },
  );
  return res.data;
}

