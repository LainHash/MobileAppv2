import axios from "axios";
import { Result, PaginationResult } from "@/common/types/Result";
import {
  CreateReservationRequest,
  Reservation,
  ReservationDetail,
} from "../types/Reservation";
import { getAuthToken } from "@/features/auth/utils/authStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function getAuthHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function createReservation(
  payload: CreateReservationRequest,
): Promise<Result<ReservationDetail>> {
  const headers = await getAuthHeaders();
  const res = await axios.post<Result<ReservationDetail>>(
    `${BASE_URL}/api/schedule/reservations`,
    payload,
    { headers },
  );
  return res.data;
}

export async function fetchMyReservations(
  pageIndex?: number,
  pageSize?: number,
): Promise<PaginationResult<Reservation[]>> {
  const headers = await getAuthHeaders();
  const res = await axios.get<PaginationResult<Reservation[]>>(
    `${BASE_URL}/api/schedule/reservations/mine`,
    {
      headers,
      params: {
        pageIndex,
        pageSize,
      },
    },
  );
  return res.data;
}

export async function fetchMyReservationById(
  id: string,
): Promise<Result<ReservationDetail>> {
  const headers = await getAuthHeaders();
  const res = await axios.get<Result<ReservationDetail>>(
    `${BASE_URL}/api/schedule/reservations/mine/${id}`,
    { headers },
  );
  return res.data;
}
