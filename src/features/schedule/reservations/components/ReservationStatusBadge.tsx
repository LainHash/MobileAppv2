import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ReservationStatus } from "../types/Reservation";

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  let label = "Chờ xác nhận";
  let bg = "#FEF3C7";
  let color = "#D97706";

  switch (status) {
    case ReservationStatus.Confirmed:
      label = "Đã xác nhận";
      bg = "#D1FAE5";
      color = "#059669";
      break;
    case ReservationStatus.Seated:
      label = "Đang phục vụ";
      bg = "#DBEAFE";
      color = "#2563EB";
      break;
    case ReservationStatus.Completed:
      label = "Hoàn thành";
      bg = "#F1F5F9";
      color = "#475569";
      break;
    case ReservationStatus.Cancelled:
      label = "Đã hủy";
      bg = "#FEE2E2";
      color = "#DC2626";
      break;
    case ReservationStatus.NoShow:
      label = "Không đến";
      bg = "#FFE4E6";
      color = "#E11D48";
      break;
    case ReservationStatus.Pending:
    default:
      label = "Chờ xác nhận";
      bg = "#FEF3C7";
      color = "#D97706";
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
