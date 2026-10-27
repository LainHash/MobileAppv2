import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { RootStackParamList } from "@/navigation/types";
import { PaymentQrCard } from "@/features/sale/orders";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type OrderSuccessRouteProp = RouteProp<RootStackParamList, "OrderSuccess">;
type OrderSuccessNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "OrderSuccess"
>;

export default function OrderSuccessScreen() {
  const route = useRoute<OrderSuccessRouteProp>();
  const navigation = useNavigation<OrderSuccessNavProp>();
  const insets = useSafeAreaInsets();

  const { orderId, orderCode, payment, distanceKm, estimatedDeliveryMinutes } = route.params;
  const [copied, setCopied] = useState(false);

  const displayCode =
    orderCode || (orderId ? orderId.slice(0, 8).toUpperCase() : "DON-HANG");

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="ĐẶT MÓN THÀNH CÔNG"
        showBack={false}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header Card */}
        <View style={styles.celebrationCard}>
          <View style={styles.checkCircle}>
            <View style={styles.checkInnerRing} />
            <Ionicons name="checkmark" size={32} color={Colors.onPrimary} />
          </View>

          <View style={styles.clubBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.secondaryGold} />
            <Text style={styles.clubBadgeText}>Đã tiếp nhận yêu cầu</Text>
          </View>

          <Text style={styles.title}>Đặt món thành công</Text>
          <Text style={styles.subtitle}>
            Trân trọng cảm ơn quý khách. Yêu cầu của bạn đã được chuyển tới bếp
            trưởng để chuẩn bị nguyên liệu tươi ngon nhất.
          </Text>

          {/* Order Code Pill */}
          <TouchableOpacity
            style={styles.orderCodePill}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <View style={styles.orderCodeInfo}>
              <Text style={styles.orderCodeLabel}>MÃ ĐƠN HÀNG</Text>
              <Text style={styles.orderCodeValue}>#{displayCode}</Text>
            </View>
            <View style={styles.copyPill}>
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={14}
                color={copied ? Colors.secondaryGold : Colors.onSurfaceVariant}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.copyPillText,
                  copied && styles.copyPillTextActive,
                ]}
              >
                {copied ? "Đã chép" : "Sao chép"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* VietQR / SePay Payment Card if available */}
        {payment && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Thông tin thanh toán VietQR</Text>
            <PaymentQrCard orderId={orderId} payment={payment} />
          </View>
        )}

        {/* Order Tips / Instructions */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons
              name="time-outline"
              size={18}
              color={Colors.secondaryGold}
            />
            <Text style={styles.infoCardTitle}>Thời gian phục vụ dự kiến</Text>
          </View>
          <Text style={styles.infoCardDesc}>
            {estimatedDeliveryMinutes
              ? `Đơn hàng dự kiến được giao trong vòng ~${estimatedDeliveryMinutes} phút${
                  distanceKm ? ` (khoảng cách vận chuyển: ${distanceKm} km)` : ""
                }. Quý khách có thể theo dõi trực tiếp trạng thái món ăn trong mục Chi tiết đơn hàng.`
              : "Món ăn sẽ được chế biến tươi nóng và hoàn tất trong vòng 20 - 35 phút. Quý khách có thể theo dõi trực tiếp trạng thái món ăn trong mục Chi tiết đơn hàng."}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("OrderDetail", { orderId })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Xem chi tiết đơn hàng</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={Colors.onPrimary}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Orders")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={Colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.secondaryButtonText}>
              Lịch sử đơn hàng của tôi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
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
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  celebrationCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    position: "relative",
    ...Shadows.subtle,
  },
  checkInnerRing: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
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
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: 300,
  },
  orderCodePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
    borderStyle: "dashed",
    width: "100%",
  },
  orderCodeInfo: {
    flex: 1,
  },
  orderCodeLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  orderCodeValue: {
    ...Typography.titleLarge,
    fontWeight: "800",
    color: Colors.primary,
    marginTop: 2,
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  copyPillText: {
    ...Typography.labelSm,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  copyPillTextActive: {
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
  sectionWrap: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  infoCardTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  infoCardDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  actionGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  primaryButtonText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  secondaryButtonText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: "700",
  },
  outlineButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: "600",
  },
});
