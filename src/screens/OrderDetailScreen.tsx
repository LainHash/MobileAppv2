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
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type OrderDetailRouteProp = RouteProp<RootStackParamList, "OrderDetail">;
type OrderDetailNavProp = NativeStackNavigationProp<RootStackParamList, "OrderDetail">;

const STEPS = [
  { label: "Đặt món", desc: "Chờ thanh toán / xác nhận" },
  { label: "Tiếp nhận", desc: "Nhà hàng đã xác nhận" },
  { label: "Chế biến", desc: "Đầu bếp đang thực hiện" },
  { label: "Hoàn tất", desc: "Món ăn đã sẵn sàng" },
  { label: "Đang giao", desc: "Giao vận đang vận chuyển" },
  { label: "Thành công", desc: "Đã giao đến thực khách" },
];

const REPORT_TOPICS = [
  "Giao thiếu món",
  "Món ăn bị nguội",
  "Giao trễ giờ hẹn",
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
  const navigation = useNavigation<OrderDetailNavProp>();
  const insets = useSafeAreaInsets();
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
      "Quý khách có chắc chắn muốn hủy đơn hàng này không?",
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
      "Xác nhận nhận món",
      "Quý khách đã nhận đầy đủ các món ăn và hài lòng với chất lượng phục vụ?",
      [
        { text: "Chưa nhận", style: "cancel" },
        {
          text: "Đã nhận đủ",
          style: "default",
          onPress: async () => {
            const success = await confirmDelivery();
            if (success) {
              Alert.alert(
                "Hoàn tất đơn hàng",
                "Cảm ơn quý khách! Chúc quý khách có một bữa tiệc ẩm thực trọn vẹn và ngon miệng.",
              );
            }
          },
        },
      ],
    );
  };

  const handleOpenReportModal = () => {
    setReportNote("");
    setContactPhone((order as any)?.deliveryPhone || (order as any)?.phoneNumber || "");
    setSelectedTopic(REPORT_TOPICS[0]);
    setIsReportModalVisible(true);
  };

  const handleCloseReportModal = () => {
    if (!isReporting) {
      setIsReportModalVisible(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportNote.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập mô tả chi tiết vấn đề bạn gặp phải.");
      return;
    }

    const success = await report({
      subject: selectedTopic,
      message: reportNote.trim(),
      phoneNumber: contactPhone.trim() || undefined,
    });

    if (success) {
      setIsReportModalVisible(false);
      Alert.alert(
        "Đã gửi khiếu nại",
        "Chúng tôi đã tiếp nhận thông tin phản hồi của quý khách và sẽ liên hệ xử lý ngay.",
      );
    }
  };

  const orderCode = order?.orderCode || orderId.slice(0, 8).toUpperCase();

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle={`ĐƠN HÀNG #${orderCode}`}
        showBack={navigation.canGoBack()}
      />

      {isLoading && !order ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
          <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
        </View>
      ) : error && !order ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Không thể tải đơn hàng</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={16} color={Colors.onPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : !order ? null : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={Colors.primaryContainer}
              colors={[Colors.primaryContainer]}
            />
          }
        >
          {/* Order Header Card */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.orderCode}>#{orderCode}</Text>
                {Boolean(order.createdAt) && (
                  <View style={styles.dateRow}>
                    <Ionicons name="time-outline" size={13} color={Colors.outline} />
                    <Text style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </View>
              <OrderStatusBadge status={order.status} size="medium" />
            </View>

            {Boolean(order.branchCode) && (
              <View style={styles.branchRow}>
                <Ionicons name="business-outline" size={16} color={Colors.secondaryGold} />
                <Text style={styles.branchText}>
                  Chi nhánh phục vụ: <Text style={styles.branchTextBold}>{order.branchCode}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Delivery Customer Action Card: Confirm delivery */}
          {canConfirmDelivered && (
            <View style={styles.deliveryActionCard}>
              <View style={styles.deliveryActionHeader}>
                <View style={styles.deliveryActionIconBox}>
                  <Ionicons name="bicycle-outline" size={22} color={Colors.secondaryGold} />
                </View>
                <View style={styles.deliveryActionTextCol}>
                  <Text style={styles.deliveryActionTitle}>
                    Đơn món đang trên đường vận chuyển
                  </Text>
                  <Text style={styles.deliveryActionSubtitle}>
                    Khi đã nhận đủ món ăn tươi nóng từ nhân viên giao hàng, quý khách vui lòng xác nhận hoàn tất.
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
                activeOpacity={0.85}
              >
                {isConfirmingDelivery ? (
                  <ActivityIndicator size="small" color={Colors.onPrimary} />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={Colors.onPrimary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.confirmDeliveryBtnText}>
                      Đã nhận đủ món ăn
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Progress Timeline Stepper */}
          {!isCancelled && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tiến trình phục vụ</Text>
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
                          {isPassed ? (
                            <Ionicons name="checkmark" size={12} color={Colors.onPrimary} />
                          ) : (
                            <View style={styles.stepDotInner} />
                          )}
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
                            isPassed && styles.stepTitlePassed,
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
            <Text style={styles.cardTitle}>Thông tin giao nhận</Text>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={Colors.secondaryGold} style={styles.infoRowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoRowLabel}>Địa chỉ giao nhận</Text>
                <Text style={styles.infoRowValue}>
                  {order.deliveryAddress || "Thưởng thức tại không gian nhà hàng"}
                </Text>
              </View>
            </View>

            {Boolean(order.customerName) && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color={Colors.secondaryGold} style={styles.infoRowIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoRowLabel}>Người nhận món</Text>
                  <Text style={styles.infoRowValue}>{order.customerName}</Text>
                </View>
              </View>
            )}

            {Boolean((order as any)?.deliveryPhone) && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={Colors.secondaryGold} style={styles.infoRowIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoRowLabel}>Số điện thoại</Text>
                  <Text style={styles.infoRowValue}>{(order as any).deliveryPhone}</Text>
                </View>
              </View>
            )}

            {Boolean(order.note) && (
              <View style={styles.infoRow}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color={Colors.secondaryGold} style={styles.infoRowIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoRowLabel}>Ghi chú cho bếp</Text>
                  <Text style={styles.infoRowValue}>{order.note}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Ordered Items Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Danh sách món đã chọn ({(order.orderDetails || order.orderItems || []).length})
            </Text>
            {(order.orderDetails || order.orderItems || []).map((item) => (
              <OrderItemCard key={item.id || item.productId} item={item} />
            ))}
          </View>

          {/* Financial Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tạm tính món ăn:</Text>
              <Text style={styles.priceValue}>{formatCurrency(order.subtotal)}</Text>
            </View>

            {order.discountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Ưu đãi đặc quyền:</Text>
                <Text style={[styles.priceValue, styles.discountText]}>
                  -{formatCurrency(order.discountAmount)}
                </Text>
              </View>
            )}

            {order.deliveryFee > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Phí giao vận:</Text>
                <Text style={styles.priceValue}>
                  {formatCurrency(order.deliveryFee)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.grandTotalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.vatNote}>(Đã bao gồm thuế GTGT & phí dịch vụ)</Text>
              </View>
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
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.onSurfaceVariant} style={{ marginRight: 6 }} />
              <Text style={styles.reportOrderText}>
                Phản hồi / Khiếu nại về đơn món này
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
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Text style={styles.cancelButtonText}>Hủy đơn món này</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Report / Complaint Modal */}
      {order && (
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
                      <Text style={styles.modalTitle}>Phản hồi chất lượng</Text>
                      <Text style={styles.modalSubtitle}>
                        Đơn hàng #{orderCode}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleCloseReportModal}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={20} color={Colors.outline} />
                    </TouchableOpacity>
                  </View>

                  {/* Topics Selection */}
                  <Text style={styles.fieldLabel}>Vấn đề quý khách gặp phải:</Text>
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
                    Chi tiết góp ý: <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Mô tả cụ thể sự cố (món thiếu, tình trạng bao bì, giờ giao...) để nhà hàng hỗ trợ xử lý ngay."
                    placeholderTextColor={Colors.outline}
                    multiline
                    numberOfLines={4}
                    value={reportNote}
                    onChangeText={setReportNote}
                    textAlignVertical="top"
                  />

                  {/* Contact phone input */}
                  <Text style={styles.fieldLabel}>
                    Số điện thoại liên hệ hỗ trợ:
                  </Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Số điện thoại nhận cuộc gọi hỗ trợ"
                    placeholderTextColor={Colors.outline}
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
                      <Text style={styles.modalCancelBtnText}>Hủy bỏ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalSubmitBtn,
                        isReporting && styles.buttonDisabled,
                      ]}
                      onPress={handleSubmitReport}
                      disabled={isReporting}
                      activeOpacity={0.85}
                    >
                      {isReporting ? (
                        <ActivityIndicator size="small" color={Colors.onPrimary} />
                      ) : (
                        <Text style={styles.modalSubmitBtnText}>Gửi phản hồi</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderCode: {
    ...Typography.headlineSm,
    color: Colors.primary,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  orderDate: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 12,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSoft,
  },
  branchText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  branchTextBold: {
    fontWeight: "700",
    color: Colors.onSurface,
  },
  deliveryActionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondaryGold,
    ...Shadows.card,
  },
  deliveryActionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  deliveryActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  deliveryActionTextCol: {
    flex: 1,
  },
  deliveryActionTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: 4,
  },
  deliveryActionSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    fontSize: 12,
  },
  confirmDeliveryBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  confirmDeliveryBtnText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  cardTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  stepperContainer: {
    paddingLeft: Spacing.xs,
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
    backgroundColor: Colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    zIndex: 2,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outline,
  },
  stepDotPassed: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  stepDotCurrent: {
    backgroundColor: Colors.secondaryGold,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderSoft,
    marginVertical: 2,
  },
  stepLinePassed: {
    backgroundColor: Colors.secondaryGold,
  },
  stepContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingBottom: Spacing.md,
  },
  stepTitle: {
    ...Typography.labelMedium,
    color: Colors.outline,
    fontWeight: "600",
  },
  stepTitlePassed: {
    color: Colors.onSurface,
  },
  stepTitleCurrent: {
    color: Colors.primary,
    fontWeight: "800",
  },
  stepDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  infoRowIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoRowLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  infoRowValue: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: "600",
    marginTop: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
  },
  priceValue: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  discountText: {
    color: Colors.error,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSoft,
    marginVertical: Spacing.sm,
  },
  grandTotalLabel: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  vatNote: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 10,
  },
  grandTotalValue: {
    ...Typography.titleLarge,
    color: Colors.primary,
    fontWeight: "800",
  },
  reportOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    paddingVertical: 12,
    ...Shadows.subtle,
  },
  reportOrderText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    paddingVertical: 12,
  },
  cancelButtonText: {
    ...Typography.labelSm,
    color: Colors.error,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.bodySm,
    marginTop: Spacing.md,
    color: Colors.onSurfaceVariant,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.titleMedium,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: 6,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  retryButtonText: {
    ...Typography.labelSm,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.floating,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  modalSubtitle: {
    ...Typography.bodySm,
    color: Colors.secondaryGold,
    fontWeight: "600",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  fieldLabel: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: "600",
    marginBottom: 6,
  },
  requiredStar: {
    color: Colors.error,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  topicChip: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  topicChipActive: {
    backgroundColor: Colors.secondaryFixed,
    borderColor: Colors.secondaryGold,
  },
  topicChipText: {
    ...Typography.labelSm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  topicChipTextActive: {
    color: Colors.onSecondaryFixed,
    fontWeight: "700",
  },
  messageInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 90,
    fontSize: 14,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  phoneInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.onSurface,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  modalCancelBtnText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: "600",
  },
  modalSubmitBtn: {
    flex: 1.5,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  modalSubmitBtnText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
});
