import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Reservation } from "../types/Reservation";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

interface ReservationCardProps {
  reservation: Reservation;
  onPress: () => void;
}

export function ReservationCard({ reservation, onPress }: ReservationCardProps) {
  const fromDate = new Date(reservation.reservedFrom);
  const formattedDate = fromDate.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const formattedTime = fromDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.codeText}>#{reservation.reservationCode}</Text>
          <Text style={styles.branchText}>
            Chi nhánh {reservation.branchCode || "nhà hàng"}
          </Text>
        </View>
        <ReservationStatusBadge status={reservation.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Thời gian đến</Text>
          <Text style={styles.infoValue}>
            🕒 {formattedTime} • {formattedDate}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.metaText}>
          👥 <Text style={styles.metaValue}>{reservation.partySize} khách</Text>
        </Text>
        {reservation.tableNumbers && reservation.tableNumbers.length > 0 ? (
          <Text style={styles.metaText}>
            🪑 Bàn:{" "}
            <Text style={styles.metaValue}>
              {reservation.tableNumbers.join(", ")}
            </Text>
          </Text>
        ) : (
          <Text style={styles.metaText}>
            🪑 <Text style={styles.metaMuted}>Nhà hàng xếp bàn</Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  codeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  branchText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  infoRow: {
    marginBottom: 6,
  },
  infoCol: {},
  infoLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#64748B",
  },
  metaValue: {
    fontWeight: "600",
    color: "#0F172A",
  },
  metaMuted: {
    fontStyle: "italic",
    color: "#94A3B8",
  },
});
