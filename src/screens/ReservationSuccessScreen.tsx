import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useAuthContext } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type ReservationSuccessNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReservationSuccess"
>;
type ReservationSuccessRouteProp = RouteProp<
  RootStackParamList,
  "ReservationSuccess"
>;

export default function ReservationSuccessScreen() {
  const navigation = useNavigation<ReservationSuccessNavigationProp>();
  const route = useRoute<ReservationSuccessRouteProp>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthContext();

  const {
    reservationCode,
    branchName,
    partySize,
    reservedFrom,
  } = route.params;

  const dateObj = reservedFrom ? new Date(reservedFrom) : new Date();
  const formattedDate = dateObj.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const formattedTime = dateObj.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="ĐẶT BÀN THÀNH CÔNG"
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <View style={styles.checkInnerRing} />
            <Ionicons name="checkmark" size={34} color={Colors.onPrimary} />
          </View>

          <View style={styles.clubBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.secondaryGold} />
            <Text style={styles.clubBadgeText}>Đã tiếp nhận yêu cầu</Text>
          </View>

          <Text style={styles.title}>Đặt bàn thành công!</Text>
          <Text style={styles.subTitle}>
            Yêu cầu đặt bàn của quý khách đã được ghi nhận trong hệ thống. Đội ngũ tiếp đón Haute De Hallen sẽ chuẩn bị chu đáo để đón tiếp quý khách.
          </Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>MÃ ĐẶT BÀN CỦA QUÝ KHÁCH</Text>
            <Text style={styles.codeValue}>#{reservationCode}</Text>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <Ionicons name="business-outline" size={15} color={Colors.secondaryGold} />
                <Text style={styles.detailLabel}>Chi nhánh phục vụ:</Text>
              </View>
              <Text style={styles.detailValue}>{branchName}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <Ionicons name="calendar-outline" size={15} color={Colors.secondaryGold} />
                <Text style={styles.detailLabel}>Thời gian đến:</Text>
              </View>
              <Text style={styles.detailValue}>
                {formattedTime} • {formattedDate}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <Ionicons name="people-outline" size={15} color={Colors.secondaryGold} />
                <Text style={styles.detailLabel}>Số lượng khách:</Text>
              </View>
              <Text style={styles.detailValue}>{partySize} người</Text>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.secondaryGold} style={{ marginTop: 1 }} />
            <Text style={styles.noticeText}>
              <Text style={styles.noticeBold}>Lưu ý:</Text> Quý khách vui lòng đến trước giờ hẹn 10 - 15 phút để nhà hàng sắp xếp vị trí bàn tiệc đẹp nhất.
            </Text>
          </View>

          <View style={styles.buttonCol}>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => navigation.replace("MyReservations")}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.onPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.historyButtonText}>Xem lịch sử đặt bàn</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate("Home")}
              activeOpacity={0.85}
            >
              <Ionicons name="home-outline" size={18} color={Colors.onSurfaceVariant} style={{ marginRight: 6 }} />
              <Text style={styles.homeButtonText}>Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    position: "relative",
    ...Shadows.subtle,
  },
  checkInnerRing: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
  },
  clubBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.sm,
  },
  clubBadgeText: {
    ...Typography.labelSm,
    color: Colors.secondaryGold,
    fontWeight: "700",
    fontSize: 11,
  },
  title: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subTitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  codeContainer: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
    borderStyle: "dashed",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  codeLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeValue: {
    ...Typography.headlineMedium,
    color: Colors.primary,
    fontWeight: "800",
  },
  detailsBox: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  detailValue: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  noticeText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    flex: 1,
    fontSize: 12,
  },
  noticeBold: {
    fontWeight: "700",
    color: Colors.onSurface,
  },
  buttonCol: {
    width: "100%",
    gap: Spacing.sm,
  },
  historyButton: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  historyButtonText: {
    ...Typography.labelMedium,
    fontWeight: "700",
    color: Colors.onPrimary,
  },
  homeButton: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 14,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  homeButtonText: {
    ...Typography.labelMedium,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
});
