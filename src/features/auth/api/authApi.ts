import axios from "axios";
import { Result } from "@/common/types/Result";
import { AuthResponse, LoginRequest, User } from "../types/auth";
import { getAuthToken } from "../utils/authStorage";

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

