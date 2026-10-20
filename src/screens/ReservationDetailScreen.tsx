import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import {
  useReservationDetail,
  ReservationStatusBadge,
} from "@/features/schedule/reservations";

type ReservationDetailRouteProp = RouteProp<
  RootStackParamList,
  "ReservationDetail"
>;

export default function ReservationDetailScreen() {
  const route = useRoute<ReservationDetailRouteProp>();
  const { reservationId } = route.params;

  const {
    reservation,
    isLoading,
    error,
    refresh,
  } = useReservationDetail(reservationId);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || "Không tìm thấy thông tin đặt bàn."}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fromDate = new Date(reservation.reservedFrom);
  const formattedDate = fromDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = fromDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCallHotline = () => {
    if (!reservation.contactPhone) {
      Alert.alert("Thông báo", "Không có số điện thoại liên hệ.");
      return;
    }
    const cleanPhone = reservation.contactPhone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch((err) => {
      console.warn("Cannot call phone", err);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 1. Header Card */}
      <View style={styles.card}>
        <View style={styles.codeRow}>
          <View>
            <Text style={styles.codeLabel}>Mã đặt bàn</Text>
            <Text style={styles.codeValue}>#{reservation.reservationCode}</Text>
          </View>
          <ReservationStatusBadge status={reservation.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.itemLabel}>📅 Ngày đến</Text>
            <Text style={styles.itemValue}>{formattedDate}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.itemLabel}>⏰ Khung giờ</Text>
            <Text style={styles.itemValue}>{formattedTime}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.itemLabel}>👥 Số lượng khách</Text>
            <Text style={styles.itemValue}>{reservation.partySize} người</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.itemLabel}>🏢 Chi nhánh</Text>
            <Text style={styles.itemValue}>
              {reservation.branchCode || "Chi nhánh chính"}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Danh sách bàn */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🪑 Vị trí bàn</Text>
        {reservation.tables && reservation.tables.length > 0 ? (
          <View style={styles.tableList}>
            {reservation.tables.map((t) => (
              <View key={t.id} style={styles.tableItem}>
                <Text style={styles.tableItemNumber}>
                  Bàn {t.tableNumber}
                </Text>
                <Text style={styles.tableItemMeta}>
                  👥 Sức chứa: {t.capacity} người{" "}
                  {t.areaName ? `• Khu vực ${t.areaName}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.autoAssignBox}>
            <Text style={styles.autoAssignText}>
              ✨ Nhà hàng sẽ tự động sắp xếp bàn phù hợp cho đoàn {reservation.partySize} khách của bạn khi đến nơi.
            </Text>
          </View>
        )}
      </View>

      {/* 3. Thông tin người liên hệ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Thông tin liên hệ</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Họ tên:</Text>
          <Text style={styles.contactValue}>{reservation.contactName}</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Số điện thoại:</Text>
          <Text style={styles.contactValue}>{reservation.contactPhone}</Text>
        </View>
        {Boolean(reservation.contactEmail) && (
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>{reservation.contactEmail}</Text>
          </View>
        )}
        {Boolean(reservation.specialRequests) && (
          <View style={[styles.contactRow, { alignItems: "flex-start" }]}>
            <Text style={styles.contactLabel}>Ghi chú:</Text>
            <Text style={[styles.contactValue, styles.specialRequestText]}>
              {reservation.specialRequests}
            </Text>
          </View>
        )}
      </View>

      {/* 4. Lịch sử trạng thái (Status Histories) */}
      {reservation.statusHistories && reservation.statusHistories.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🕒 Tiến trình xử lý</Text>
          <View style={styles.timeline}>
            {reservation.statusHistories.map((h, idx) => {
              const hDate = new Date(h.createdAt);
              const isLast = idx === reservation.statusHistories.length - 1;
              return (
                <View key={h.id} style={styles.timelineItem}>
                  <View style={styles.timelineDotCol}>
                    <View style={styles.timelineDot} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>
                      Trạng thái: {h.toStatus}
                    </Text>
                    {Boolean(h.reason) && (
                      <Text style={styles.timelineReason}>{h.reason}</Text>
                    )}
                    <Text style={styles.timelineDate}>
                      {hDate.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {hDate.toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Nút hành động */}
      <View style={styles.actionCol}>
        <TouchableOpacity
          style={styles.hotlineButton}
          onPress={handleCallHotline}
          activeOpacity={0.8}
        >
          <Text style={styles.hotlineButtonText}>📞 Gọi hotline chi nhánh</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  codeValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  infoGrid: {
    gap: 10,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  itemValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  tableList: {
    gap: 8,
  },
  tableItem: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tableItemNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  tableItemMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  autoAssignBox: {
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
  },
  autoAssignText: {
    fontSize: 13,
    color: "#166534",
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  contactValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  specialRequestText: {
    flex: 1,
    textAlign: "right",
    marginLeft: 16,
  },
  timeline: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
  },
  timelineDotCol: {
    alignItems: "center",
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineStatus: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  timelineReason: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  actionCol: {
    marginTop: 4,
  },
  hotlineButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  hotlineButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
});
