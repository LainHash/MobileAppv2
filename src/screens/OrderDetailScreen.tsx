import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import {
  useOrderDetail,
  OrderStatusBadge,
  OrderItemCard,
  OrderStatus,
  normalizeOrderStatus,
  isDeliveryOrder,
  canCancelOrder,
} from "@/features/commerce/orders";
import { formatCurrency } from "@/common/helpers";

type OrderDetailRouteProp = RouteProp<RootStackParamList, "OrderDetail">;

const STEPS = [
  { label: "Đặt hàng", desc: "Chờ thanh toán / xác nhận" },
  { label: "Xác nhận", desc: "Quán đã tiếp nhận" },
  { label: "Chuẩn bị", desc: "Đang chế biến món" },
  { label: "Sẵn sàng", desc: "Món đã nấu xong" },
  { label: "Đang giao", desc: "Tài xế đang vận chuyển" },
  { label: "Hoàn thành", desc: "Giao món thành công" },
];

const REPORT_TOPICS = [
  "Giao thiếu món",
  "Món ăn bị nguội",
  "Giao trễ giờ",
  "Món bị đổ / hỏng bao bì",
  "Sai món đã đặt",
  "Vấn đề khác",
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case OrderStatus.Draft:
    case OrderStatus.Pending:
      return 0;
    case OrderStatus.Confirmed:
      return 1;
    case OrderStatus.Preparing:
      return 2;
    case OrderStatus.Ready:
    case OrderStatus.Served:
      return 3;
    case OrderStatus.Delivering:
      return 4;
    case OrderStatus.Completed:
      return 5;
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
    isConfirmingDelivery,
    isReporting,
    error,
    refresh,
    cancel,
    confirmDelivery,
    report,
  } = useOrderDetail({ orderId });

  // Reporting modal state
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(REPORT_TOPICS[0]);
  const [reportNote, setReportNote] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const currentStatus = normalizeOrderStatus(order?.status);
  const currentStep = getStepIndex(currentStatus);
  const isCancelled = currentStatus === OrderStatus.Cancelled;

  // Only cancellable when Pending or Draft
  const canCancel = canCancelOrder(currentStatus);

  // Delivery order features
  const isDelivery = order ? isDeliveryOrder(order.type) : false;
  const canConfirmDelivered =
    isDelivery && currentStatus === OrderStatus.Delivering;
  const canReport =
    isDelivery &&
    (currentStatus === OrderStatus.Delivering ||
      currentStatus === OrderStatus.Completed);

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

  const handleConfirmDeliveredPress = () => {
    Alert.alert(
      "Xác nhận nhận hàng",
      "Bạn đã nhận được đầy đủ các món ăn và hài lòng với đơn giao hàng này?",
      [
        { text: "Chưa nhận", style: "cancel" },
        {
          text: "Đã nhận thành công",
          style: "default",
          onPress: async () => {
            const success = await confirmDelivery();
            if (success) {
              Alert.alert(
                "Hoàn tất đơn hàng",
                "Cảm ơn bạn đã xác nhận! Chúc bạn có một bữa ăn ngon miệng.",
              );
            }
          },
        },
      ],
    );
  };

  const handleOpenReportModal = () => {
    setIsReportModalVisible(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalVisible(false);
    setReportNote("");
  };

  const handleSubmitReport = async () => {
    if (!reportNote.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập chi tiết phản hồi / khiếu nại.");
      return;
    }

    const payload = {
      subject: selectedTopic,
      message: reportNote.trim(),
      phoneNumber: contactPhone.trim() || undefined,
      fullName: order?.customerName || undefined,
    };

    const success = await report(payload);
    if (success) {
      handleCloseReportModal();
      Alert.alert(
        "Gửi phản ánh thành công",
        "Chúng tôi đã ghi nhận khiếu nại của bạn về đơn hàng. Quán sẽ kiểm tra và liên hệ hỗ trợ bạn sớm nhất có thể.",
      );
    }
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
    <>
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

        {/* Delivery Customer Action Card: Confirm delivery */}
        {canConfirmDelivered && (
          <View style={styles.deliveryActionCard}>
            <View style={styles.deliveryActionHeader}>
              <View style={styles.deliveryActionIconBox}>
                <Text style={styles.deliveryActionIcon}>🛵</Text>
              </View>
              <View style={styles.deliveryActionTextCol}>
                <Text style={styles.deliveryActionTitle}>
                  Đơn hàng đang trên đường giao
                </Text>
                <Text style={styles.deliveryActionSubtitle}>
                  Khi đã nhận đủ các món ăn từ shipper, bạn hãy xác nhận để hoàn
                  thành đơn hàng nhé!
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmDeliveryBtn,
                isConfirmingDelivery && styles.buttonDisabled,
              ]}
              onPress={handleConfirmDeliveredPress}
              disabled={isConfirmingDelivery}
              activeOpacity={0.8}
            >
              {isConfirmingDelivery ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.confirmDeliveryBtnIcon}>✓</Text>
                  <Text style={styles.confirmDeliveryBtnText}>
                    Đã nhận được hàng
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

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

        {/* Report / Complaint Order Button */}
        {canReport && (
          <TouchableOpacity
            style={styles.reportOrderBtn}
            onPress={handleOpenReportModal}
            activeOpacity={0.8}
          >
            <Text style={styles.reportOrderIcon}>💬</Text>
            <Text style={styles.reportOrderText}>
              Báo cáo / Khiếu nại đơn hàng này
            </Text>
          </TouchableOpacity>
        )}

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

      {/* Report / Complaint Modal */}
      <Modal
        visible={isReportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseReportModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Báo cáo / Khiếu nại</Text>
                    <Text style={styles.modalSubtitle}>
                      Đơn hàng #{order.orderCode || order.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCloseReportModal}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Topics Selection */}
                <Text style={styles.fieldLabel}>Lý do khiếu nại:</Text>
                <View style={styles.topicsContainer}>
                  {REPORT_TOPICS.map((topic) => {
                    const isSelected = selectedTopic === topic;
                    return (
                      <TouchableOpacity
                        key={topic}
                        style={[
                          styles.topicChip,
                          isSelected && styles.topicChipActive,
                        ]}
                        onPress={() => setSelectedTopic(topic)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.topicChipText,
                            isSelected && styles.topicChipTextActive,
                          ]}
                        >
                          {topic}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Message input */}
                <Text style={styles.fieldLabel}>
                  Chi tiết vấn đề: <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Mô tả cụ thể sự cố (món thiếu, tình trạng bao bì, giờ giao...) để nhà hàng hỗ trợ xử lý."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={reportNote}
                  onChangeText={setReportNote}
                  textAlignVertical="top"
                />

                {/* Contact phone input */}
                <Text style={styles.fieldLabel}>
                  Số điện thoại nhận phản hồi (tùy chọn):
                </Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Nhập SĐT để nhân viên gọi hỗ trợ"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                />

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={handleCloseReportModal}
                    disabled={isReporting}
                  >
                    <Text style={styles.modalCancelBtnText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalSubmitBtn,
                      isReporting && styles.buttonDisabled,
                    ]}
                    onPress={handleSubmitReport}
                    disabled={isReporting}
                    activeOpacity={0.8}
                  >
                    {isReporting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSubmitBtnText}>Gửi khiếu nại</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
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

  // Delivery action card
  deliveryActionCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  deliveryActionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  deliveryActionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryActionIcon: {
    fontSize: 20,
  },
  deliveryActionTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  deliveryActionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 3,
  },
  deliveryActionSubtitle: {
    fontSize: 13,
    color: "#047857",
    lineHeight: 18,
  },
  confirmDeliveryBtn: {
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmDeliveryBtnIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 6,
  },
  confirmDeliveryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // Report button
  reportOrderBtn: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  reportOrderIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reportOrderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B45309",
  },

  // Cancel button
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

  // Modal styles
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginTop: 10,
  },
  requiredStar: {
    color: "#DC2626",
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  topicChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  topicChipText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  topicChipTextActive: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 88,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtnText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  modalSubmitBtn: {
    flex: 1.6,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
