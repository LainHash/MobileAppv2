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
import { RootStackParamList } from "@/navigation/types";
import { useAuthContext } from "@/features/auth";

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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Đặt bàn thành công!</Text>
        <Text style={styles.subTitle}>
          Yêu cầu đặt bàn của bạn đã được ghi nhận. Nhà hàng sẽ liên hệ xác nhận nếu cần thêm thông tin.
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>MÃ ĐẶT BÀN CỦA BẠN</Text>
          <Text style={styles.codeValue}>#{reservationCode}</Text>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Chi nhánh:</Text>
            <Text style={styles.detailValue}>{branchName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thời gian:</Text>
            <Text style={styles.detailValue}>
              {formattedTime} • {formattedDate}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số lượng khách:</Text>
            <Text style={styles.detailValue}>{partySize} người</Text>
          </View>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            💡 <Text style={styles.noticeBold}>Lưu ý:</Text> Vui lòng đến trước giờ hẹn khoảng 10-15 phút để nhà hàng sắp xếp vị trí tốt nhất. Nếu có thay đổi lịch, vui lòng liên hệ hotline chi nhánh.
          </Text>
        </View>

        <View style={styles.buttonCol}>
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => navigation.replace("MyReservations")}
              activeOpacity={0.8}
            >
              <Text style={styles.historyButtonText}>📋 Xem lịch sử đặt bàn</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.8}
          >
            <Text style={styles.homeButtonText}>🏠 Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  codeContainer: {
    width: "100%",
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#15803D",
  },
  detailsBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  noticeBox: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    width: "100%",
  },
  noticeText: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  noticeBold: {
    fontWeight: "700",
  },
  buttonCol: {
    width: "100%",
    gap: 10,
  },
  historyButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  homeButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
});
