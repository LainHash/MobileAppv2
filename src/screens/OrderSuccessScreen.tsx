import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { RootStackParamList } from "@/navigation/types";
import { PaymentQrCard } from "@/features/commerce/orders";

type OrderSuccessRouteProp = RouteProp<RootStackParamList, "OrderSuccess">;
type OrderSuccessNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "OrderSuccess"
>;

export default function OrderSuccessScreen() {
  const route = useRoute<OrderSuccessRouteProp>();
  const navigation = useNavigation<OrderSuccessNavProp>();

  const { orderId, orderCode, payment } = route.params;
  const [copied, setCopied] = useState(false);

  const displayCode = orderCode || (orderId ? orderId.slice(0, 8).toUpperCase() : "DON-HANG");

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header Card */}
        <View style={styles.celebrationCard}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Đặt hàng thành công!</Text>
          <Text style={styles.subtitle}>
            Cảm ơn bạn đã lựa chọn chúng tôi. Đơn hàng của bạn đã được chuyển tới bếp để chuẩn bị.
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
              <Text style={styles.copyPillText}>
                {copied ? "✓ Đã sao chép" : "Sao chép"}
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
          <Text style={styles.infoCardTitle}>⏱️ Thời gian xử lý dự kiến</Text>
          <Text style={styles.infoCardDesc}>
            Món ăn sẽ sẵn sàng và được giao trong vòng 20 - 30 phút. Bạn có thể theo dõi tiến trình đơn hàng trong mục Lịch sử đơn hàng.
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
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Orders")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Lịch sử đơn hàng của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineButtonText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  celebrationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  checkIcon: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 300,
  },
  orderCodePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: "100%",
  },
  orderCodeInfo: {
    flex: 1,
  },
  orderCodeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  orderCodeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#007AFF",
    marginTop: 2,
  },
  copyPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  copyPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  infoCardDesc: {
    fontSize: 12,
    color: "#15803D",
    lineHeight: 18,
  },
  actionGroup: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  outlineButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  outlineButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
});
