import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Reservation } from "../types/Reservation";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

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
          <View style={styles.branchRow}>
            <Ionicons name="storefront-outline" size={13} color={Colors.secondary} />
            <Text style={styles.branchText}>
              Chi nhánh {reservation.branchCode || "nhà hàng"}
            </Text>
          </View>
        </View>
        <ReservationStatusBadge status={reservation.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>THỜI GIAN ĐẾN</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={15} color={Colors.primary} />
            <Text style={styles.infoValue}>
              {formattedTime} • {formattedDate}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.metaBadge}>
          <Ionicons name="people-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.metaValue}>{reservation.partySize} khách</Text>
        </View>

        {reservation.tableNumbers && reservation.tableNumbers.length > 0 ? (
          <View style={styles.metaBadge}>
            <Ionicons name="restaurant-outline" size={14} color={Colors.secondary} />
            <Text style={styles.metaValue}>
              Bàn: {reservation.tableNumbers.join(", ")}
            </Text>
          </View>
        ) : (
          <View style={styles.metaBadge}>
            <Ionicons name="restaurant-outline" size={14} color={Colors.outline} />
            <Text style={styles.metaMuted}>Nhà hàng xếp bàn</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  codeText: {
    ...Typography.labelLg,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  branchText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
    marginVertical: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoCol: {
    gap: 4,
  },
  infoLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoValue: {
    ...Typography.bodyMd,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaValue: {
    ...Typography.bodySm,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  metaMuted: {
    ...Typography.bodySm,
    fontStyle: "italic",
    color: Colors.outline,
  },
});
