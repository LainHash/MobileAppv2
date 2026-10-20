import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import {
  useMyReservations,
  ReservationCard,
  ReservationStatus,
} from "@/features/schedule/reservations";
import { useAuthContext } from "@/features/auth";

type MyReservationsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyReservations"
>;

export default function MyReservationsScreen() {
  const navigation = useNavigation<MyReservationsNavigationProp>();
  const { isAuthenticated } = useAuthContext();
  const { reservations, isLoading, error, refresh } = useMyReservations();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const filteredReservations = useMemo(() => {
    const now = new Date().getTime();

    return reservations.filter((r) => {
      const isCancelledOrCompleted =
        r.status === ReservationStatus.Completed ||
        r.status === ReservationStatus.Cancelled ||
        r.status === ReservationStatus.NoShow;
      const isPastTime = new Date(r.reservedTo || r.reservedFrom).getTime() < now;

      if (activeTab === "upcoming") {
        return !isCancelledOrCompleted && !isPastTime;
      } else {
        return isCancelledOrCompleted || isPastTime;
      }
    });
  }, [reservations, activeTab]);

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Yêu cầu đăng nhập</Text>
        <Text style={styles.emptySub}>
          Vui lòng đăng nhập tài khoản để theo dõi và quản lý lịch sử đặt bàn của bạn.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.actionButtonText}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "upcoming" && styles.tabItemActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.tabTextActive,
            ]}
          >
            Sắp tới
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "past" && styles.tabItemActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.tabTextActive,
            ]}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && reservations.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : Boolean(error) && reservations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={refresh}>
            <Text style={styles.actionButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filteredReservations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>
            {activeTab === "upcoming"
              ? "Chưa có lượt đặt bàn sắp tới"
              : "Chưa có lịch sử đặt bàn"}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === "upcoming"
              ? "Hãy chọn chi nhánh và khung giờ phù hợp để giữ chỗ cùng bạn bè và gia đình."
              : "Các lượt đặt bàn đã hoàn tất hoặc đã hủy sẽ hiển thị tại đây."}
          </Text>
          {activeTab === "upcoming" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Reservation")}
            >
              <Text style={styles.actionButtonText}>+ Đặt bàn ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} />
          }
          renderItem={({ item }) => (
            <ReservationCard
              reservation={item}
              onPress={() =>
                navigation.navigate("ReservationDetail", {
                  reservationId: item.id,
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#007AFF",
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
});
