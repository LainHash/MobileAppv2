import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import {
  useOrders,
  OrderStatusBadge,
  OrderStatus,
  OrderResponse,
} from "@/features/commerce/orders";
import { useAuth } from "@/features/auth";
import { formatCurrency } from "@/common/helpers";

type OrdersNavProp = NativeStackNavigationProp<RootStackParamList, "Orders">;

const STATUS_TABS: { label: string; status?: OrderStatus }[] = [
  { label: "Tất cả" },
  { label: "Chờ thanh toán", status: OrderStatus.Draft },
  { label: "Chờ xác nhận", status: OrderStatus.Pending },
  { label: "Đang chuẩn bị", status: OrderStatus.Preparing },
  { label: "Đang giao", status: OrderStatus.Delivering },
  { label: "Hoàn thành", status: OrderStatus.Completed },
  { label: "Đã hủy", status: OrderStatus.Cancelled },
];

export default function OrdersScreen() {
  const navigation = useNavigation<OrdersNavProp>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<number>(0);

  const selectedStatus = STATUS_TABS[activeTab].status;

  const { orders, isLoading, isRefreshing, error, refresh } = useOrders({
    status: selectedStatus,
    enabled: isAuthenticated,
  });

  const renderOrderItem = ({ item }: { item: OrderResponse }) => {
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
        activeOpacity={0.8}
      >
        {/* Header: Code & Status */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderCode}>#{item.orderCode || item.id.slice(0, 8).toUpperCase()}</Text>
            {Boolean(formattedDate) && (
              <Text style={styles.orderDate}>{formattedDate}</Text>
            )}
          </View>
          <OrderStatusBadge status={item.status} size="small" />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Body info */}
        <View style={styles.cardBody}>
          {Boolean(item.deliveryAddress) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText} numberOfLines={1}>
                {item.deliveryAddress}
              </Text>
            </View>
          )}

          {Boolean(item.branchCode) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🏪</Text>
              <Text style={styles.infoText}>Chi nhánh: {item.branchCode}</Text>
            </View>
          )}
        </View>

        {/* Footer: Items count and Total Amount */}
        <View style={styles.cardFooter}>
          <Text style={styles.itemCountText}>
            {item.totalItems || 1} món ăn
          </Text>
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Horizontal Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {STATUS_TABS.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <TouchableOpacity
                key={tab.label}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(idx)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      {isAuthLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang kiểm tra tài khoản...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptySub}>
            Vui lòng đăng nhập để theo dõi và xem lịch sử đơn hàng của bạn.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.browseButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Không thể tải đơn hàng</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
          <Text style={styles.emptySub}>
            Bạn chưa có đơn hàng nào ở trạng thái này. Hãy khám phá ngay thực đơn và chọn những món ăn hấp dẫn nhé!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Menu")}
            activeOpacity={0.85}
          >
            <Text style={styles.browseButtonText}>Xem thực đơn</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              colors={["#007AFF"]}
            />
          }
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
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  tabButtonActive: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderCode: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  orderDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  cardBody: {
    gap: 6,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#F8FAFC",
  },
  itemCountText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  totalWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#007AFF",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  errorSub: {
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  browseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
