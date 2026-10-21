import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useCart } from "@/features/commerce/carts";
import { useCheckout } from "@/features/sale/orders";
import { useAuth } from "@/features/auth";
import {
  useBranches,
  getSelectedBranchId,
} from "@/features/territory/branches";
import { formatCurrency, getProductImageUrl } from "@/common/helpers";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type CheckoutRouteProp = RouteProp<RootStackParamList, "Checkout">;
type CheckoutNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Checkout"
>;

const DELIVERY_FEE = 15000;

export default function CheckoutScreen() {
  const route = useRoute<CheckoutRouteProp>();
  const navigation = useNavigation<CheckoutNavProp>();
  const insets = useSafeAreaInsets();

  const routeBranchId = route.params?.branchId ?? null;
  const [branchId, setBranchId] = useState<string | null>(routeBranchId);
  const [isStorageLoaded, setIsStorageLoaded] = useState(
    Boolean(routeBranchId),
  );

  // Load branch ID if missing
  useEffect(() => {
    if (!routeBranchId) {
      getSelectedBranchId().then((id) => {
        if (id) setBranchId(id);
        setIsStorageLoaded(true);
      });
    }
  }, [routeBranchId]);

  const { branches } = useBranches();
  const currentBranch = useMemo(
    () => branches.find((b) => b.id === branchId) || null,
    [branches, branchId],
  );

  const { cart, isLoading: isCartLoading } = useCart(branchId, {
    enabled: isStorageLoaded,
  });
  const { user } = useAuth();
  const { submitOrder, isSubmitting, error: checkoutError } = useCheckout();

  // Form states
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "cod">(
    "vietqr",
  );
  const [showItemDetails, setShowItemDetails] = useState(true);

  // Auto-populate from user profile if available
  useEffect(() => {
    if (user) {
      const p = user.personalProfile;
      if (p) {
        const fullName = `${p.lastName || ""} ${p.firstName || ""}`.trim();
        if (fullName) setRecipientName((prev) => (prev ? prev : fullName));
        if (p.phone) setPhone((prev) => (prev ? prev : p.phone));
        const fullAddr =
          `${p.address || ""}${p.city ? `, ${p.city}` : ""}`.trim();
        if (fullAddr) setAddress((prev) => (prev ? prev : fullAddr));
      } else if (user.userName) {
        setRecipientName((prev) => (prev ? prev : user.userName));
      }
    }
  }, [user]);

  const items = useMemo(() => cart?.cartItems ?? [], [cart?.cartItems]);

  const { subtotal, currency } = useMemo(() => {
    let price = 0;
    let cur = "₫";
    for (const item of items) {
      if (item.product?.unitPrice) {
        price += item.product.unitPrice * item.quantity;
      }
      if (item.product?.currency) {
        cur = item.product.currency;
      }
    }
    return { subtotal: price, currency: cur };
  }, [items]);

  const grandTotal = Math.max(
    0,
    subtotal + (items.length > 0 ? DELIVERY_FEE : 0),
  );

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      Alert.alert(
        "Giỏ hàng trống",
        "Vui lòng chọn ít nhất một món ăn trước khi đặt hàng.",
      );
      return;
    }

    if (!recipientName.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập họ và tên người nhận hàng.",
      );
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập số điện thoại liên hệ nhận hàng.",
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập địa chỉ giao hàng chi tiết.",
      );
      return;
    }

    if (!branchId) {
      Alert.alert(
        "Chưa chọn chi nhánh",
        "Vui lòng chọn chi nhánh nhà hàng phục vụ.",
      );
      return;
    }

    const orderItems = items.map((it) => {
      const pid = it.product?.id || it.productId || it.id;
      return {
        productId: pid,
        quantity: it.quantity,
      };
    });

    const fullNote = [
      `Người nhận: ${recipientName.trim()} - SĐT: ${phone.trim()}`,
      note.trim() ? `Ghi chú: ${note.trim()}` : "",
      paymentMethod === "cod"
        ? "Phương thức: Thanh toán khi nhận hàng (COD)"
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const res = await submitOrder({
      branchId,
      deliveryAddress: address.trim(),
      note: fullNote,
      deliveryFee: DELIVERY_FEE,
      items: orderItems,
    });

    if (res) {
      navigation.replace("OrderSuccess", {
        orderId: res.order.id,
        orderCode: res.order.orderCode,
        payment: res.payment,
        totalAmount: res.order.totalAmount || grandTotal,
      });
    }
  };

  if (isCartLoading && !cart) {
    return (
      <View style={styles.screenWrapper}>
        <HauteTopBar
          title="Thanh toán"
          subtitle="Xác nhận đơn hàng"
          showBack={true}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            Đang chuẩn bị thông tin thanh toán...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* Haute Top Navigation Bar */}
      <HauteTopBar
        title="Thanh toán"
        subtitle="Xác nhận đơn hàng"
        showBack={true}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 90 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Branch Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons
                  name="storefront"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <Text style={styles.cardSubtitle}>Chi nhánh phục vụ</Text>
                <Text style={styles.branchName}>
                  {currentBranch
                    ? `Chi nhánh ${currentBranch.branchCode} - ${currentBranch.city}`
                    : "Chi nhánh Haute De Hallen"}
                </Text>
                <Text style={styles.branchAddress}>
                  {currentBranch?.address ||
                    "Đang cập nhật địa chỉ phục vụ..."}
                </Text>
              </View>
            </View>
          </View>

          {/* Delivery Information Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.cardTitle}>Thông tin giao hàng</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Họ và tên người nhận <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Nguyễn Văn A"
                value={recipientName}
                onChangeText={setRecipientName}
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Số điện thoại <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 0912345678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Địa chỉ nhận hàng <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                multiline
                numberOfLines={2}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Ghi chú cho bếp & tài xế (tuỳ chọn)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="VD: Giao trước 12h, ít đá, không cay..."
                multiline
                numberOfLines={2}
                value={note}
                onChangeText={setNote}
                placeholderTextColor={Colors.outline}
              />
            </View>
          </View>

          {/* Order Items Review */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardTitleRowBetween}
              onPress={() => setShowItemDetails(!showItemDetails)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTitleRowNoMargin}>
                <View style={styles.iconCircle}>
                  <MaterialIcons
                    name="restaurant-menu"
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.cardTitle}>
                  Món ăn đã chọn ({items.length})
                </Text>
              </View>
              <Text style={styles.toggleText}>
                {showItemDetails ? "Thu gọn ▲" : "Xem chi tiết ▼"}
              </Text>
            </TouchableOpacity>

            {showItemDetails && (
              <View style={styles.itemsList}>
                {items.length === 0 ? (
                  <Text style={styles.emptyItemsText}>
                    Chưa có món ăn nào trong giỏ hàng.
                  </Text>
                ) : (
                  items.map((it) => {
                    const img = getProductImageUrl(it);
                    const itemTotal =
                      (it.product?.unitPrice || 0) * it.quantity;
                    const pid = it.product?.id || it.productId || it.id;

                    return (
                      <View key={pid} style={styles.itemRow}>
                        {img ? (
                          <Image
                            source={{ uri: img }}
                            style={styles.itemImage}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View
                            style={[
                              styles.itemImage,
                              styles.itemImagePlaceholder,
                            ]}
                          >
                            <Ionicons
                              name="fast-food-outline"
                              size={20}
                              color={Colors.outline}
                            />
                          </View>
                        )}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {it.product?.name || "Món ăn"}
                          </Text>
                          <Text style={styles.itemQuantity}>
                            Số lượng: x{it.quantity}
                          </Text>
                        </View>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(itemTotal, it.product?.currency)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Payment Method Selection */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
            </View>

            {/* VietQR Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "vietqr" && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod("vietqr")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === "vietqr" && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === "vietqr" && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.paymentInfo}>
                <View style={styles.badgeRow}>
                  <Text style={styles.paymentTitle}>
                    Chuyển khoản QR (VietQR / SePay)
                  </Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>
                      Tự động xác nhận
                    </Text>
                  </View>
                </View>
                <Text style={styles.paymentDesc}>
                  Quét mã QR qua ứng dụng ngân hàng. Hệ thống xác nhận và đẩy
                  đơn vào bếp tức thì.
                </Text>
              </View>
            </TouchableOpacity>

            {/* COD Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "cod" && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod("cod")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.radioCircle,
                  paymentMethod === "cod" && styles.radioCircleActive,
                ]}
              >
                {paymentMethod === "cod" && <View style={styles.radioDot} />}
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>
                  Thanh toán khi nhận hàng (COD)
                </Text>
                <Text style={styles.paymentDesc}>
                  Nhận món ăn và thanh toán tiền mặt trực tiếp cho nhân viên giao
                  hàng.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Price Breakdown */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="receipt-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Tạm tính ({items.length} món):
              </Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(subtotal, currency)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Phí giao hàng tiêu chuẩn:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(DELIVERY_FEE, currency)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(grandTotal, currency)}
              </Text>
            </View>
          </View>

          {Boolean(checkoutError) && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={Colors.error}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{checkoutError}</Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Checkout Footer */}
        <View
          style={[
            styles.footerBar,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
        >
          <View style={styles.footerPriceInfo}>
            <Text style={styles.footerTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.footerTotalPrice}>
              {formatCurrency(grandTotal, currency)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || items.length === 0) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleConfirmOrder}
            disabled={isSubmitting || items.length === 0}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.onPrimary} />
            ) : (
              <View style={styles.submitBtnContent}>
                <Text style={styles.submitButtonText}>Xác nhận đặt hàng</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={Colors.onPrimary}
                  style={styles.submitBtnIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardSubtitle: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  branchName: {
    ...Typography.labelLg,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: "700",
  },
  branchAddress: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardTitleRowNoMargin: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardTitleRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleText: {
    ...Typography.labelMd,
    color: Colors.secondaryGold,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  requiredStar: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  itemsList: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderSoft,
    paddingTop: Spacing.sm,
  },
  emptyItemsText: {
    ...Typography.bodySm,
    color: Colors.outline,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  itemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    ...Typography.bodyMd,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  itemQuantity: {
    ...Typography.bodySm,
    color: Colors.outline,
    marginTop: 2,
  },
  itemPrice: {
    ...Typography.labelLg,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceContainerLowest,
    marginBottom: Spacing.sm,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceContainerLow,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentTitle: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  recommendedBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  recommendedBadgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.onSecondaryFixed,
  },
  paymentDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  breakdownLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  breakdownValue: {
    ...Typography.bodyMd,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  totalValue: {
    ...Typography.headlineMd,
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryContainer,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  errorIcon: {
    marginRight: 2,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
    flex: 1,
    lineHeight: 18,
  },
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.floating,
  },
  footerPriceInfo: {
    flex: 1,
  },
  footerTotalLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  footerTotalPrice: {
    ...Typography.headlineMd,
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryContainer,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitBtnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  submitBtnIcon: {
    marginLeft: 6,
  },
});
