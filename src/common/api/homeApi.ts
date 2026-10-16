import axios from "axios";
import { Result } from "../types/Result";
import { Home } from "../types/Home";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface HomeApiProps {
  branchId?: string | null;
}

export async function fetchHomeData(
  propsOrBranchId?: string | null | HomeApiProps,
): Promise<Result<Home>> {
  const branchId =
    typeof propsOrBranchId === "string"
      ? propsOrBranchId
      : propsOrBranchId?.branchId;

  const params = new URLSearchParams();
  if (branchId) {
    params.append("branchId", branchId);
  }
  const query = params.toString();
  const url = query ? `${BASE_URL}/api/home?${query}` : `${BASE_URL}/api/home`;
  const res = await axios.get<Result<Home>>(url);
  return res.data;
}
