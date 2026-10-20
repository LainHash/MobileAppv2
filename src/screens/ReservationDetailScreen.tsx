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
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import {
  useReservationDetail,
  ReservationStatusBadge,
} from "@/features/schedule/reservations";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type ReservationDetailRouteProp = RouteProp<
  RootStackParamList,
  "ReservationDetail"
>;
type ReservationDetailNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReservationDetail"
>;

export default function ReservationDetailScreen() {
  const route = useRoute<ReservationDetailRouteProp>();
  const navigation = useNavigation<ReservationDetailNavProp>();
  const insets = useSafeAreaInsets();
  const { reservationId } = route.params;

  const {
    reservation,
    isLoading,
    error,
    refresh,
  } = useReservationDetail(reservationId);

  const handleCallHotline = () => {
    if (!reservation?.contactPhone) {
      Alert.alert("Thông báo", "Chi nhánh hiện chưa có số điện thoại liên hệ.");
      return;
    }
    const cleanPhone = reservation.contactPhone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch((err) => {
      console.warn("Cannot call phone", err);
    });
  };

  const fromDate = reservation?.reservedFrom ? new Date(reservation.reservedFrom) : null;
  const formattedDate = fromDate
    ? fromDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      })
    : "";
  const formattedTime = fromDate
    ? fromDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      })
    : "";

  const reservationCode = reservation?.reservationCode || reservationId.slice(0, 8).toUpperCase();

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle={`ĐẶT BÀN #${reservationCode}`}
        showBack={navigation.canGoBack()}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
          <Text style={styles.loadingText}>Đang tải thông tin đặt bàn...</Text>
        </View>
      ) : error || !reservation ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Không tìm thấy thông tin đặt bàn</Text>
          <Text style={styles.errorText}>
            {error || "Yêu cầu đặt bàn không tồn tại hoặc đã bị xóa."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={16} color={Colors.onPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header Card with Code & Status */}
          <View style={styles.card}>
            <View style={styles.codeRow}>
              <View>
                <Text style={styles.codeLabel}>MÃ ĐẶT BÀN</Text>
                <Text style={styles.codeValue}>#{reservationCode}</Text>
              </View>
              <ReservationStatusBadge status={reservation.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.itemIconRow}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.secondaryGold} />
                  <Text style={styles.itemLabel}>Ngày đến</Text>
                </View>
                <Text style={styles.itemValue}>{formattedDate}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.itemIconRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.secondaryGold} />
                  <Text style={styles.itemLabel}>Khung giờ hẹn</Text>
                </View>
                <Text style={styles.itemValue}>{formattedTime}</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.itemIconRow}>
                  <Ionicons name="people-outline" size={16} color={Colors.secondaryGold} />
                  <Text style={styles.itemLabel}>Số lượng khách</Text>
                </View>
                <Text style={styles.itemValue}>{reservation.partySize} khách</Text>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.itemIconRow}>
                  <Ionicons name="business-outline" size={16} color={Colors.secondaryGold} />
                  <Text style={styles.itemLabel}>Chi nhánh</Text>
                </View>
                <Text style={styles.itemValue}>
                  {reservation.branchCode || "Chi nhánh chính"}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Danh sách bàn */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="restaurant-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Vị trí bàn tiệc</Text>
            </View>

            {reservation.tables && reservation.tables.length > 0 ? (
              <View style={styles.tableList}>
                {reservation.tables.map((t) => (
                  <View key={t.id} style={styles.tableItem}>
                    <View style={styles.tableNumberBadge}>
                      <Text style={styles.tableItemNumber}>
                        Bàn {t.tableNumber}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tableItemMeta}>
                        Sức chứa: {t.capacity} người {t.areaName ? `• Khu vực ${t.areaName}` : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.autoAssignBox}>
                <Ionicons name="sparkles" size={16} color={Colors.secondaryGold} style={{ marginTop: 1 }} />
                <Text style={styles.autoAssignText}>
                  Nhà hàng sẽ tự động sắp xếp không gian bàn tiệc phù hợp nhất cho đoàn {reservation.partySize} khách của quý khách khi đến nơi.
                </Text>
              </View>
            )}
          </View>

          {/* 3. Thông tin người đặt & Ghi chú */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
            </View>

            {Boolean(reservation.contactName) && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Người liên hệ:</Text>
                <Text style={styles.contactValue}>{reservation.contactName}</Text>
              </View>
            )}

            {Boolean(reservation.contactPhone) && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Số điện thoại:</Text>
                <Text style={styles.contactValue}>{reservation.contactPhone}</Text>
              </View>
            )}

            {Boolean(reservation.contactEmail) && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Email:</Text>
                <Text style={styles.contactValue}>{reservation.contactEmail}</Text>
              </View>
            )}

            {Boolean(reservation.specialRequests) && (
              <View style={styles.notesBox}>
                <View style={styles.notesLabelRow}>
                  <Ionicons name="chatbox-ellipses-outline" size={14} color={Colors.secondaryGold} />
                  <Text style={styles.notesLabel}>Ghi chú đặc biệt:</Text>
                </View>
                <Text style={styles.notesText}>{reservation.specialRequests}</Text>
              </View>
            )}
          </View>

          {/* Hotline Button */}
          {Boolean(reservation.contactPhone) && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallHotline}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={18} color={Colors.onPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.callButtonText}>
                Gọi nhà hàng hỗ trợ: {reservation.contactPhone}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  codeValue: {
    ...Typography.headlineSm,
    color: Colors.primary,
    fontWeight: "800",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSoft,
    marginVertical: Spacing.md,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing.md,
  },
  infoItem: {
    width: "50%",
    paddingRight: Spacing.sm,
  },
  itemIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  itemLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  itemValue: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  tableList: {
    gap: Spacing.sm,
  },
  tableItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    gap: Spacing.md,
  },
  tableNumberBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  tableItemNumber: {
    ...Typography.labelMedium,
    fontWeight: "800",
    color: Colors.onSecondaryFixed,
  },
  tableItemMeta: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  autoAssignBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  autoAssignText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSoft,
  },
  contactLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  contactValue: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  notesBox: {
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  notesLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  notesLabel: {
    ...Typography.labelSm,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
  notesText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    lineHeight: 18,
  },
  callButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  callButtonText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.bodySm,
    marginTop: Spacing.md,
    color: Colors.onSurfaceVariant,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.titleMedium,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: 6,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  retryButtonText: {
    ...Typography.labelSm,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
});
