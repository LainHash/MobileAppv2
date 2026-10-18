import { Result } from "@/common/types/Result";

export interface CreateContactMessageRequest {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  customerId?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  subject: string;
  message: string;
  sessionId?: string | null;
  status: number;
  emailStatus: number;
  emailSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SendContactMessageResult = Result<ContactMessageResponse>;
