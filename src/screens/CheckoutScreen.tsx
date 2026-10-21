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
import { RootStackParamList } from "@/navigation/types";
import { useCart } from "@/features/commerce/carts";
import { useCheckout } from "@/features/sale/orders";
import { useAuth } from "@/features/auth";
import {
  useBranches,
  getSelectedBranchId,
} from "@/features/territory/branches";
import { formatCurrency, getProductImageUrl } from "@/common/helpers";

type CheckoutRouteProp = RouteProp<RootStackParamList, "Checkout">;
type CheckoutNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Checkout"
>;

const DELIVERY_FEE = 15000;

export default function CheckoutScreen() {
  const route = useRoute<CheckoutRouteProp>();
  const navigation = useNavigation<CheckoutNavProp>();

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Đang chuẩn bị thông tin thanh toán...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Branch Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderIcon}>🏪</Text>
            <View style={styles.cardHeaderTextWrap}>
              <Text style={styles.cardTitle}>Chi nhánh phục vụ</Text>
              <Text style={styles.branchName}>
                {currentBranch
                  ? `Chi nhánh ${currentBranch.branchCode} - ${currentBranch.city}`
                  : "Chi nhánh nhà hàng"}
              </Text>
              <Text style={styles.branchAddress}>
                {currentBranch?.address || "Đang xác định địa chỉ chi nhánh..."}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Information Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardHeaderIcon}>📍</Text>
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Ghi chú cho nhà bếp (tuỳ chọn)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="VD: Giao trước 12h, ít cay, không hành tây..."
              multiline
              numberOfLines={2}
              value={note}
              onChangeText={setNote}
              placeholderTextColor="#94A3B8"
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
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardHeaderIcon}>🍽️</Text>
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
              {items.map((it) => {
                const img = getProductImageUrl(it);
                const itemTotal = (it.product?.unitPrice || 0) * it.quantity;
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
                        style={[styles.itemImage, styles.itemImagePlaceholder]}
                      >
                        <Text>🍲</Text>
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
              })}
            </View>
          )}
        </View>

        {/* Payment Method Selection */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardHeaderIcon}>💳</Text>
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
            <View style={styles.radioCircle}>
              {paymentMethod === "vietqr" && <View style={styles.radioDot} />}
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
                Quét mã QR bằng mọi app ngân hàng. Hệ thống xác nhận thanh toán
                tức thì.
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
            <View style={styles.radioCircle}>
              {paymentMethod === "cod" && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Thanh toán khi nhận hàng (COD)
              </Text>
              <Text style={styles.paymentDesc}>
                Nhận món ăn và thanh toán tiền mặt trực tiếp cho tài xế giao
                hàng.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              Tạm tính ({items.length} món):
            </Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(subtotal, currency)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Phí giao hàng:</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(DELIVERY_FEE, currency)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(grandTotal, currency)}
            </Text>
          </View>
        </View>

        {Boolean(checkoutError) && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {checkoutError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Checkout Footer */}
      <View style={styles.footerBar}>
        <View style={styles.footerPriceInfo}>
          <Text style={styles.footerTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotalPrice}>
            {formatCurrency(grandTotal, currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleConfirmOrder}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Xác nhận đặt hàng</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardHeaderIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  branchName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 2,
  },
  branchAddress: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitleRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  requiredStar: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: {
    minHeight: 56,
    textAlignVertical: "top",
  },
  itemsList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  itemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  paymentOptionActive: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  paymentInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  recommendedBadge: {
    backgroundColor: "#DEF7EC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#03543F",
  },
  paymentDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#007AFF",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 18,
  },
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  footerPriceInfo: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  footerTotalPrice: {
    fontSize: 19,
    fontWeight: "800",
    color: "#007AFF",
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
