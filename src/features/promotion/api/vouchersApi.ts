import axios from "axios";
import { Result } from "@/common/types/Result";
import { getAuthToken } from "@/features/auth";
import { getOrCreateSessionId } from "@/common/utils/sessionStorage";
import type {
  CustomerVoucherResponse,
  ValidateVoucherRequest,
  ValidateVoucherResultResponse,
  VoucherResponse,
} from "../types/voucher";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function buildHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const sessionId = await getOrCreateSessionId();
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  const token = await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function validateVoucher(
  request: ValidateVoucherRequest,
): Promise<Result<ValidateVoucherResultResponse>> {
  const headers = await buildHeaders();
  const url = `${BASE_URL}/api/promotion/Vouchers/validate`;
  const res = await axios.post<Result<ValidateVoucherResultResponse>>(url, request, {
    headers,
  });
  return res.data;
}

export async function getPublicVouchers(
  branchId?: string | number,
  channel: number = 2, // 2 = Mobile
): Promise<Result<VoucherResponse[]>> {
  const headers = await buildHeaders();
  const url = `${BASE_URL}/api/promotion/Vouchers/public`;
  const params: Record<string, any> = { channel };
  if (branchId) {
    params.branchId = branchId;
  }
  const res = await axios.get<Result<VoucherResponse[]>>(url, {
    headers,
    params,
  });
  return res.data;
}

export async function getMyWalletVouchers(): Promise<Result<CustomerVoucherResponse[]>> {
  const headers = await buildHeaders();
  const url = `${BASE_URL}/api/promotion/Vouchers/wallet`;
  const res = await axios.get<Result<CustomerVoucherResponse[]>>(url, { headers });
  return res.data;
}

export async function claimVoucher(code: string): Promise<Result<CustomerVoucherResponse>> {
  const headers = await buildHeaders();
  const url = `${BASE_URL}/api/promotion/Vouchers/claim`;
  const res = await axios.post<Result<CustomerVoucherResponse>>(url, { code }, { headers });
  return res.data;
}
