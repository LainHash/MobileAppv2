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
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import {
  useOrders,
  OrderStatusBadge,
  OrderStatus,
  OrderResponse,
} from "@/features/sale/orders";
import { useAuth } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { formatCurrency } from "@/common/helpers";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

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
        activeOpacity={0.85}
      >
        {/* Header: Code & Status */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderCode}>
              #{item.orderCode || item.id.slice(0, 8).toUpperCase()}
            </Text>
            {Boolean(formattedDate) && (
              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={Colors.outline}
                />
                <Text style={styles.orderDate}>{formattedDate}</Text>
              </View>
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
              <Ionicons
                name="location-outline"
                size={15}
                color={Colors.primary}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.deliveryAddress}
              </Text>
            </View>
          )}

          {Boolean(item.branchCode) && (
            <View style={styles.infoRow}>
              <Ionicons
                name="storefront-outline"
                size={15}
                color={Colors.secondary}
              />
              <Text style={styles.infoText}>Chi nhánh: {item.branchCode}</Text>
            </View>
          )}
        </View>

        {/* Footer: Items count and Total Amount */}
        <View style={styles.cardFooter}>
          <View style={styles.itemCountWrap}>
            <Ionicons
              name="restaurant-outline"
              size={14}
              color={Colors.outline}
            />
            <Text style={styles.itemCountText}>
              {item.totalItems || 1} món ẩm thực
            </Text>
          </View>

          <View style={styles.footerRight}>
            <View style={styles.totalWrap}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(item.totalAmount)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.outline} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Luxury Haute Top Bar */}
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="LỊCH SỬ ĐƠN HÀNG"
        showBack={true}
      />

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
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang kiểm tra tài khoản...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.centerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="person-outline"
              size={44}
              color={Colors.secondary}
            />
          </View>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptySub}>
            Vui lòng đăng nhập để theo dõi và xem lịch sử đơn hàng của quý
            khách.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: "rgba(186, 26, 26, 0.08)" },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={44}
              color={Colors.error}
            />
          </View>
          <Text style={styles.emptyTitle}>Không thể tải đơn hàng</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={refresh}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="receipt-outline"
              size={44}
              color={Colors.secondary}
            />
          </View>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
          <Text style={styles.emptySub}>
            Quý khách chưa có đơn hàng nào ở trạng thái này. Khám phá ngay thực
            đơn thượng hạng của Haute De Hallen!
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Menu")}
            activeOpacity={0.85}
          >
            <Text style={styles.actionButtonText}>Khám phá thực đơn</Text>
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
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
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
  tabsContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    gap: Spacing.md,
  },
  orderCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderCode: {
    ...Typography.labelLg,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  orderDate: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.outline,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
    marginVertical: 12,
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  itemCountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemCountText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontWeight: "500",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  totalAmount: {
    ...Typography.labelLg,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    color: Colors.onSurface,
    marginBottom: 8,
  },
  emptySub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 290,
  },
  errorSub: {
    ...Typography.bodySm,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  actionButtonText: {
    color: Colors.onPrimary,
    ...Typography.labelMd,
    fontWeight: "700",
  },
});
