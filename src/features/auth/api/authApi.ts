import axios from "axios";
import { Result } from "@/common/types/Result";
import {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  User,
} from "../types/auth";
import { getAuthToken, getRefreshToken } from "../utils/authStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function getMe(
  tokenOverride?: string | null,
): Promise<Result<User>> {
  const token =
    tokenOverride !== undefined ? tokenOverride : await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await axios.get<Result<User>>(
    `${BASE_URL}/api/authentication/me`,
    { headers },
  );
  return res.data;
}

export async function Login(data: LoginRequest): Promise<Result<AuthResponse>> {
  const res = await axios.post<Result<AuthResponse>>(
    `${BASE_URL}/api/authentication/login`,
    data,
  );
  return res.data;
}

export const login = Login;

/**
 * Làm mới access token bằng refresh token.
 * Nếu không truyền refresh token, hàm sẽ tự động lấy từ AsyncStorage.
 */
export async function refreshToken(
  data?: RefreshTokenRequest | string | null,
): Promise<Result<AuthResponse>> {
  let tokenStr: string | null | undefined;
  if (typeof data === "string") {
    tokenStr = data;
  } else if (data?.refreshToken) {
    tokenStr = data.refreshToken;
  } else {
    tokenStr = await getRefreshToken();
  }

  const payload: RefreshTokenRequest = {
    refreshToken: tokenStr ?? "",
  };

  const res = await axios.post<Result<AuthResponse>>(
    `${BASE_URL}/api/authentication/refresh`,
    payload,
  );
  return res.data;
}

export const refresh = refreshToken;
export const RefreshToken = refreshToken;

/**
 * Đăng xuất tài khoản hiện tại, hủy refresh token trên server.
 * Tự động lấy refresh token và access token từ storage nếu không truyền vào.
 */
export async function logout(
  data?: LogoutRequest | string | null,
  tokenOverride?: string | null,
): Promise<Result<void>> {
  let refreshTokenStr: string | null | undefined;
  if (typeof data === "string") {
    refreshTokenStr = data;
  } else if (data?.refreshToken) {
    refreshTokenStr = data.refreshToken;
  } else {
    refreshTokenStr = await getRefreshToken();
  }

  const token =
    tokenOverride !== undefined ? tokenOverride : await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const payload: LogoutRequest = {
    refreshToken: refreshTokenStr ?? "",
  };

  const res = await axios.post<Result<void>>(
    `${BASE_URL}/api/authentication/logout`,
    payload,
    { headers },
  );
  return res.data;
}

export const Logout = logout;

/**
 * Đăng xuất khỏi tất cả các thiết bị.
 */
export async function logoutAll(
  tokenOverride?: string | null,
): Promise<Result<void>> {
  const token =
    tokenOverride !== undefined ? tokenOverride : await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await axios.post<Result<void>>(
    `${BASE_URL}/api/authentication/logout-all`,
    {},
    { headers },
  );
  return res.data;
}

export const LogoutAll = logoutAll;


