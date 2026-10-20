export enum ReservationStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Seated = "Seated",
  Completed = "Completed",
  Cancelled = "Cancelled",
  NoShow = "NoShow",
}

export interface CreateReservationRequest {
  branchId: string;
  reservedFrom: string; // ISO 8601 UTC string
  reservedTo?: string; // ISO 8601 UTC string
  partySize: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialRequests?: string;
  tableIds?: string[];
}

export interface Reservation {
  id: string;
  reservationCode: string;
  branchId: string;
  branchCode?: string;
  customerId?: string;
  customerName?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  partySize: number;
  reservedFrom: string;
  reservedTo: string;
  status: ReservationStatus;
  specialRequests?: string;
  tableCount: number;
  tableNumbers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservationTableItem {
  id: string;
  tableId: string;
  tableNumber: string;
  capacity: number;
  areaName?: string;
}

export interface ReservationStatusHistoryItem {
  id: string;
  fromStatus?: ReservationStatus;
  toStatus: ReservationStatus;
  reason?: string;
  createdAt: string;
}

export interface ReservationDetail extends Reservation {
  tables: ReservationTableItem[];
  statusHistories: ReservationStatusHistoryItem[];
  cancelledAt?: string;
  cancellationReason?: string;
}
