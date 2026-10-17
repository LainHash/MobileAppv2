import axios from "axios";
import { Result } from "@/common/types/Result";
import {
  AddCartItemRequest,
  Cart,
  RemoveCartItemRequest,
  UpdateCartItemQuantityRequest,
} from "../types/Cart";
import { getOrCreateSessionId } from "@/common/utils/sessionStorage";
import { getSelectedBranchId } from "@/features/territory/branches";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface CartApiOptions {
  branchId?: string | null;
  sessionId?: string | null;
}

/**
 * Resolves session ID for header (X-Session-Id) and branch ID for query string (?branchId=).
 */
async function buildCartRequestConfig(
  optionsOrBranchId?: string | null | CartApiOptions,
) {
  let branchId: string | null | undefined;
  let sessionId: string | null | undefined;

  if (typeof optionsOrBranchId === "string" || optionsOrBranchId === null) {
    branchId = optionsOrBranchId;
  } else if (optionsOrBranchId) {
    branchId = optionsOrBranchId.branchId;
    sessionId = optionsOrBranchId.sessionId;
  }

  // Fallback to selected branch from storage if not provided
  if (branchId === undefined) {
    branchId = await getSelectedBranchId();
  }

  // Fallback to stored or newly generated session id if not provided
  if (!sessionId) {
    sessionId = await getOrCreateSessionId();
  }

  const headers: Record<string, string> = {};
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  const params = new URLSearchParams();
  if (branchId) {
    params.append("branchId", branchId);
  }
  const query = params.toString();

  return { headers, query };
}

export async function fetchCart(
  optionsOrBranchId?: string | null | CartApiOptions,
): Promise<Result<Cart>> {
  const { headers, query } = await buildCartRequestConfig(optionsOrBranchId);
  const url = query
    ? `${BASE_URL}/api/commerce/carts/mine?${query}`
    : `${BASE_URL}/api/commerce/carts/mine`;
  const res = await axios.get<Result<Cart>>(url, { headers });
  return res.data;
}

export async function addCartItem(
  data: AddCartItemRequest,
  optionsOrBranchId?: string | null | CartApiOptions,
): Promise<Result<Cart>> {
  const { headers, query } = await buildCartRequestConfig(optionsOrBranchId);
  const url = query
    ? `${BASE_URL}/api/commerce/carts/mine/items?${query}`
    : `${BASE_URL}/api/commerce/carts/mine/items`;
  const res = await axios.post<Result<Cart>>(url, data, { headers });
  return res.data;
}

export async function removeCartItem(
  data: RemoveCartItemRequest,
  optionsOrBranchId?: string | null | CartApiOptions,
): Promise<Result<Cart>> {
  const { headers, query } = await buildCartRequestConfig(optionsOrBranchId);
  const url = query
    ? `${BASE_URL}/api/commerce/carts/mine/items?${query}`
    : `${BASE_URL}/api/commerce/carts/mine/items`;
  const res = await axios.delete<Result<Cart>>(url, { data, headers });
  return res.data;
}

export async function updateCartItemQuantity(
  data: UpdateCartItemQuantityRequest,
  optionsOrBranchId?: string | null | CartApiOptions,
): Promise<Result<Cart>> {
  const { headers, query } = await buildCartRequestConfig(optionsOrBranchId);
  const url = query
    ? `${BASE_URL}/api/commerce/carts/mine/items/quantity?${query}`
    : `${BASE_URL}/api/commerce/carts/mine/items/quantity`;
  const res = await axios.put<Result<Cart>>(url, data, { headers });
  return res.data;
}
