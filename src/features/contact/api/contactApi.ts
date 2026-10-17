import axios from "axios";
import { Result } from "@/common/types/Result";
import { getAuthToken } from "@/features/auth";
import { getOrCreateSessionId } from "@/common/utils/sessionStorage";
import { CreateContactMessageRequest, ContactMessageResponse } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function sendContactMessage(
  data: CreateContactMessageRequest,
): Promise<Result<ContactMessageResponse>> {
  const token = await getAuthToken();
  const sessionId = await getOrCreateSessionId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  const res = await axios.post<Result<ContactMessageResponse>>(
    `${BASE_URL}/api/communication/contact-messages`,
    data,
    { headers },
  );

  return res.data;
}
