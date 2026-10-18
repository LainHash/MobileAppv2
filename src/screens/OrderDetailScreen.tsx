import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import {
  useOrderDetail,
  OrderStatusBadge,
  OrderItemCard,
  OrderStatus,
  normalizeOrderStatus,
} from "@/features/commerce/orders";
import { formatCurrency } from "@/common/helpers";

type OrderDetailRouteProp = RouteProp<RootStackParamList, "OrderDetail">;

const STEPS = [
  { label: "Đặt hàng", desc: "Chờ thanh toán / xác nhận" },
  { label: "Xác nhận", desc: "Bếp đã tiếp nhận" },
  { label: "Chuẩn bị", desc: "Đang chế biến món" },
  { label: "Đang giao", desc: "Tài xế đang vận chuyển" },
  { label: "Hoàn thành", desc: "Giao món thành công" },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case OrderStatus.Draft:
      return 0;
    case OrderStatus.Pending:
      return 0;
    case OrderStatus.Confirmed:
      return 1;
    case OrderStatus.Preparing:
    case OrderStatus.Served:
      return 2;
    case OrderStatus.Delivering:
      return 3;
    case OrderStatus.Completed:
      return 4;
    case OrderStatus.Cancelled:
      return -1;
    default:
      return 0;
  }
}

export default function OrderDetailScreen() {
  const route = useRoute<OrderDetailRouteProp>();
  const { orderId } = route.params;

  const {
    order,
    isLoading,
    isRefreshing,
    isCancelling,
    error,
    refresh,
    cancel,
  } = useOrderDetail({ orderId });

  const currentStatus = normalizeOrderStatus(order?.status);
  const currentStep = getStepIndex(currentStatus);
  const isCancelled = currentStatus === OrderStatus.Cancelled;

  // Can cancel if Draft or Pending/Confirmed
  const canCancel =
    currentStatus === OrderStatus.Draft ||
    currentStatus === OrderStatus.Pending ||
    currentStatus === OrderStatus.Confirmed;

  const handleCancelPress = () => {
    Alert.alert(
      "Hủy đơn hàng",
      "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Đồng ý hủy",
          style: "destructive",
          onPress: async () => {
            const success = await cancel();
            if (success) {
              Alert.alert("Thành công", "Đơn hàng đã được hủy.");
            }
          },
        },
      ],
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Không thể tải đơn hàng</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) return null;

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const items = order.orderDetails || order.orderItems || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          colors={["#007AFF"]}
        />
      }
    >
      {/* Order Header Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orderCode}>
              #{order.orderCode || order.id.slice(0, 8).toUpperCase()}
            </Text>
            {Boolean(formattedDate) && (
              <Text style={styles.orderDate}>{formattedDate}</Text>
            )}
          </View>
          <OrderStatusBadge status={order.status} size="medium" />
        </View>

        {Boolean(order.branchCode) && (
          <View style={styles.branchRow}>
            <Text style={styles.branchIcon}>🏪</Text>
            <Text style={styles.branchText}>
              Chi nhánh: {order.branchCode}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Timeline Stepper */}
      {!isCancelled && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiến trình đơn hàng</Text>
          <View style={styles.stepperContainer}>
            {STEPS.map((step, idx) => {
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <View key={step.label} style={styles.stepItem}>
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepDot,
                        isPassed && styles.stepDotPassed,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    >
                      {isPassed && <Text style={styles.stepDotCheck}>✓</Text>}
                    </View>
                    {idx < STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          idx < currentStep && styles.stepLinePassed,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCurrent && styles.stepTitleCurrent,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Delivery Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin nhận hàng</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Địa chỉ:</Text>
          <Text style={styles.detailValue}>
            {order.deliveryAddress || "Tại nhà hàng"}
          </Text>
        </View>

        {Boolean(order.customerName) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Khách hàng:</Text>
            <Text style={styles.detailValue}>{order.customerName}</Text>
          </View>
        )}

        {Boolean(order.note) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ghi chú:</Text>
            <Text style={styles.detailValue}>{order.note}</Text>
          </View>
        )}
      </View>

      {/* Ordered Items Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Danh sách món ({items.length})</Text>
        {items.map((item) => (
          <OrderItemCard key={item.id || item.productId} item={item} />
        ))}
      </View>

      {/* Financial Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tổng kết thanh toán</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Tạm tính:</Text>
          <Text style={styles.priceValue}>{formatCurrency(order.subtotal)}</Text>
        </View>

        {order.discountAmount > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giảm giá:</Text>
            <Text style={[styles.priceValue, styles.discountText]}>
              -{formatCurrency(order.discountAmount)}
            </Text>
          </View>
        )}

        {order.deliveryFee > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Phí giao hàng:</Text>
            <Text style={styles.priceValue}>
              {formatCurrency(order.deliveryFee)}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.grandTotalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(order.totalAmount)}
          </Text>
        </View>
      </View>

      {/* Cancel Order Button */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
          onPress={handleCancelPress}
          disabled={isCancelling}
          activeOpacity={0.8}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text style={styles.cancelButtonText}>Hủy đơn hàng này</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
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
  card: {
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderCode: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  orderDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  branchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  branchText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  stepperContainer: {
    paddingLeft: 4,
  },
  stepItem: {
    flexDirection: "row",
    minHeight: 52,
  },
  stepIndicatorCol: {
    alignItems: "center",
    width: 28,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepDotPassed: {
    backgroundColor: "#10B981",
  },
  stepDotCurrent: {
    backgroundColor: "#007AFF",
    borderWidth: 3,
    borderColor: "#BFDBFE",
  },
  stepDotCheck: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  stepLinePassed: {
    backgroundColor: "#10B981",
  },
  stepContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 14,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  stepTitleCurrent: {
    color: "#0F172A",
    fontWeight: "700",
  },
  stepDesc: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    width: 90,
    fontSize: 13,
    color: "#64748B",
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#0F172A",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  discountText: {
    color: "#16A34A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});
