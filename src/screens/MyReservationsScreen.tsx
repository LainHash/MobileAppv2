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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import {
  useMyReservations,
  ReservationCard,
  ReservationStatus,
} from "@/features/schedule/reservations";
import { useAuthContext } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type MyReservationsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyReservations"
>;

export default function MyReservationsScreen() {
  const navigation = useNavigation<MyReservationsNavigationProp>();
  const insets = useSafeAreaInsets();
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

  return (
    <View style={styles.screenWrapper}>
      {/* Luxury Haute Top Bar */}
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="LỊCH SỬ ĐẶT BÀN"
        showBack={true}
      />

      {/* Tabs */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabPillGroup}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "upcoming" && styles.tabItemActive]}
            onPress={() => setActiveTab("upcoming")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="calendar"
              size={14}
              color={activeTab === "upcoming" ? Colors.onPrimary : Colors.onSurfaceVariant}
            />
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
            activeOpacity={0.8}
          >
            <Ionicons
              name="time"
              size={14}
              color={activeTab === "past" ? Colors.onPrimary : Colors.onSurfaceVariant}
            />
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
      </View>

      {/* Main Content Area */}
      {!isAuthenticated ? (
        <View style={styles.centerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={40} color={Colors.secondary} />
          </View>
          <Text style={styles.emptyTitle}>Yêu cầu đăng nhập</Text>
          <Text style={styles.emptySub}>
            Vui lòng đăng nhập tài khoản để theo dõi và quản lý lịch sử đặt bàn tiệc của quý khách.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading && reservations.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử đặt bàn...</Text>
        </View>
      ) : Boolean(error) && reservations.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(186, 26, 26, 0.08)" }]}>
            <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
          </View>
          <Text style={styles.emptyTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={refresh}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filteredReservations.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="restaurant-outline" size={44} color={Colors.secondary} />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === "upcoming"
              ? "Chưa có lượt đặt bàn sắp tới"
              : "Chưa có lịch sử đặt bàn"}
          </Text>
          <Text style={styles.emptySub}>
            {activeTab === "upcoming"
              ? "Hãy chọn chi nhánh và khung giờ phù hợp để giữ chỗ cùng bạn bè, gia đình và đối tác."
              : "Các lượt đặt bàn tiệc đã hoàn tất hoặc đã hủy sẽ được lưu giữ tại đây."}
          </Text>
          {activeTab === "upcoming" && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Reservation")}
              activeOpacity={0.85}
            >
              <View style={styles.btnRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.onPrimary} />
                <Text style={styles.actionButtonText}>Đặt bàn tiệc ngay</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
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
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBarContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  tabPillGroup: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.full,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.labelSm,
    fontWeight: "600",
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: Colors.onPrimary,
  },
  listContent: {
    padding: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 290,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButtonText: {
    ...Typography.labelMd,
    fontWeight: "700",
    color: Colors.onPrimary,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
});
