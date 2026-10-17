import axios from "axios";
import { Result } from "@/common/types/Result";
import {
  AddWishlistItemRequest,
  Wishlist,
  RemoveWishlistItemRequest,
} from "../types/Wishlist";
import { getOrCreateSessionId } from "@/common/utils/sessionStorage";
import { getSelectedBranchId } from "@/features/territory/branches";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface WishlistApiOptions {
  branchId?: string | null;
  sessionId?: string | null;
}

/**
 * Resolves session ID for header (X-Session-Id) and branch ID for query string (?branchId=).
 */
async function buildWishlistRequestConfig(
  optionsOrBranchId?: string | null | WishlistApiOptions,
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

export async function fetchWishlist(
  optionsOrBranchId?: string | null | WishlistApiOptions,
): Promise<Result<Wishlist>> {
  const { headers, query } = await buildWishlistRequestConfig(optionsOrBranchId);
  const url = query
    ? `${BASE_URL}/api/commerce/wishlists/mine?${query}`
    : `${BASE_URL}/api/commerce/wishlists/mine`;
  const res = await axios.get<Result<Wishlist>>(url, { headers });
  return res.data;
}

export async function addWishlistItem(
  data: AddWishlistItemRequest,
  optionsOrBranchId?: string | null | WishlistApiOptions,
): Promise<Result<Wishlist>> {
  const { headers, query } = await buildWishlistRequestConfig(optionsOrBranchId);
  const url = query
    ? `${BASE_URL}/api/commerce/wishlists/mine/items?${query}`
    : `${BASE_URL}/api/commerce/wishlists/mine/items`;
  const res = await axios.post<Result<Wishlist>>(url, data, { headers });
  return res.data;
}

export async function removeWishlistItem(
  data: RemoveWishlistItemRequest,
  optionsOrBranchId?: string | null | WishlistApiOptions,
): Promise<Result<Wishlist>> {
  const { headers, query } = await buildWishlistRequestConfig(optionsOrBranchId);
  const url = query
    ? `${BASE_URL}/api/commerce/wishlists/mine/items?${query}`
    : `${BASE_URL}/api/commerce/wishlists/mine/items`;
  const res = await axios.delete<Result<Wishlist>>(url, { data, headers });
  return res.data;
}
