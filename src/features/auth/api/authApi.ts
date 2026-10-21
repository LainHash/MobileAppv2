import axios from "axios";
import { Result } from "@/common/types/Result";
import {
  AuthResponse,
  CompleteProfileRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendVerificationRequest,
  User,
  VerifyEmailRequest,
  OtpPurpose,
  ForgotPasswordRequest,
  VerifyPasswordResetOtpRequest,
  VerifyPasswordResetOtpResponse,
  ResetPasswordRequest,
  UpdatePersonalProfileRequest,
  ChangePasswordRequest,
} from "../types/auth";
import {
  getAuthToken,
  getRefreshToken,
  getPendingRegisterEmail,
  savePendingRegisterEmail,
} from "../utils/authStorage";

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

export async function register(data: RegisterRequest): Promise<Result> {
  if (data?.email) {
    await savePendingRegisterEmail(data.email);
  }
  const res = await axios.post<Result>(
    `${BASE_URL}/api/authentication/register`,
    data,
  );
  return res.data;
}

export async function verifyEmail(data: VerifyEmailRequest): Promise<Result> {
  const email = data.email || (await getPendingRegisterEmail()) || "";
  const payload: VerifyEmailRequest = {
    ...data,
    email,
  };
  const res = await axios.post<Result>(
    `${BASE_URL}/api/authentication/verify-email`,
    payload,
  );
  return res.data;
}

export async function resendVerificationCode(
  data?: ResendVerificationRequest,
): Promise<Result> {
  const email = data?.email || (await getPendingRegisterEmail()) || "";
  const payload: ResendVerificationRequest = {
    email,
    purpose: data?.purpose || OtpPurpose.EmailVerification,
  };
  const res = await axios.post<Result>(
    `${BASE_URL}/api/authentication/resend-verification`,
    payload,
  );
  return res.data;
}

export async function completeProfile(
  data: CompleteProfileRequest,
): Promise<Result> {
  const email = data.email || (await getPendingRegisterEmail()) || "";
  const payload: CompleteProfileRequest = {
    ...data,
    email,
  };
  const res = await axios.post<Result>(
    `${BASE_URL}/api/authentication/complete-profile`,
    payload,
  );
  return res.data;
}

export async function forgotPassword(
  data: ForgotPasswordRequest,
): Promise<Result> {
  const res = await axios.post<Result>(
    `${BASE_URL}/api/authentication/forgot-password`,
    data,
  );
  return res.data;
}

export async function verifyPasswordResetOtp(
  data: VerifyPasswordResetOtpRequest,
): Promise<Result<VerifyPasswordResetOtpResponse>> {
  const res = await axios.post<Result<VerifyPasswordResetOtpResponse>>(
    `${BASE_URL}/api/authentication/verify-reset-otp`,
    data,
  );
  return res.data;
}

export async function resetPassword(
  data: ResetPasswordRequest,
): Promise<Result> {
  const res = await axios.post<Result>(
    `${BASE_URL}/api/authentication/reset-password`,
    data,
  );
  return res.data;
}

export async function updatePersonalProfile(
  data: UpdatePersonalProfileRequest,
  tokenOverride?: string | null,
): Promise<Result> {
  const token =
    tokenOverride !== undefined ? tokenOverride : await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await axios.put<Result>(
    `${BASE_URL}/api/authentication/me/profile`,
    data,
    { headers },
  );
  return res.data;
}

export async function changePassword(
  data: ChangePasswordRequest,
  tokenOverride?: string | null,
): Promise<Result> {
  const token =
    tokenOverride !== undefined ? tokenOverride : await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await axios.post<Result>(
    `${BASE_URL}/api/authentication/me/change-password`,
    data,
    { headers },
  );
  return res.data;
}


