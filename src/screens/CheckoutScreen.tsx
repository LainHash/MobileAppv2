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
  saveSelectedBranchId,
  useOptimalBranch,
} from "@/features/territory/branches";
import { formatCurrency, getProductImageUrl } from "@/common/helpers";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import {
  VoucherSelectorModal,
  ValidateVoucherResultResponse,
} from "@/features/promotion";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";


type CheckoutRouteProp = RouteProp<RootStackParamList, "Checkout">;
type CheckoutNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Checkout"
>;

const DEFAULT_DELIVERY_FEE = 16000;

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

  // Hook for GPS position and optimal branch / distance derivation
  const {
    userLocation,
    optimalData,
    isLoading: isLocatingOptimal,
    locateAndCalculate,
  } = useOptimalBranch(false);

  // Optimal distance, delivery time, and dynamic shipping fee
  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_DELIVERY_FEE);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [estimatedDeliveryMinutes, setEstimatedDeliveryMinutes] =
    useState<number | null>(null);
  const [isDeliverable, setIsDeliverable] = useState<boolean | null>(true);

  // Auto-locate GPS on mount to compute optimal distance & fee
  useEffect(() => {
    if (branchId) {
      locateAndCalculate(branchId, false);
    }
  }, [branchId, locateAndCalculate]);

  // Update distance, delivery minutes and dynamic shipping fee whenever optimalData is updated
  useEffect(() => {
    if (optimalData) {
      const match =
        optimalData.branch?.id === branchId
          ? optimalData
          : optimalData.nearbyBranches?.find((b) => b.branch?.id === branchId);

      if (match) {
        setDistanceKm(match.distanceKm);
        setEstimatedDeliveryMinutes(match.estimatedDeliveryMinutes);
        setDeliveryFee(match.estimatedDeliveryFee || DEFAULT_DELIVERY_FEE);
        setIsDeliverable(match.isDeliverable);
      } else {
        setDistanceKm(optimalData.distanceKm);
        setEstimatedDeliveryMinutes(optimalData.estimatedDeliveryMinutes);
        setDeliveryFee(optimalData.estimatedDeliveryFee || DEFAULT_DELIVERY_FEE);
        setIsDeliverable(optimalData.isDeliverable);
      }
    }
  }, [optimalData, branchId]);

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

  // Voucher / Promotion state
  const [appliedVoucher, setAppliedVoucher] =
    useState<ValidateVoucherResultResponse | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

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

  const discountAmount = appliedVoucher?.discountAmount || 0;

  const grandTotal = Math.max(
    0,
    subtotal + (items.length > 0 ? deliveryFee : 0) - discountAmount,
  );

  // Auto-remove voucher if cart subtotal drops below voucher's minOrderAmount
  useEffect(() => {
    if (
      appliedVoucher &&
      appliedVoucher.minOrderAmount &&
      subtotal < appliedVoucher.minOrderAmount
    ) {
      const code = appliedVoucher.voucherCode;
      const minAmount = appliedVoucher.minOrderAmount;
      setAppliedVoucher(null);
      Alert.alert(
        "Mã ưu đãi không khả dụng",
        `Đơn hàng cần đạt tối thiểu ${formatCurrency(minAmount)} để áp dụng mã ${code}. Mã đã được gỡ bỏ.`,
      );
    }
  }, [subtotal, appliedVoucher]);

  const handleLocateGps = async () => {
    const data = await locateAndCalculate(branchId, false);
    if (data?.branch) {
      if (!address.trim() && userLocation?.address) {
        setAddress(userLocation.address);
      }
    }
  };

  const handleUseGpsAddress = () => {
    if (userLocation?.address) {
      setAddress(userLocation.address);
    }
  };

  const handleSwitchToOptimalBranch = async (optimalBranchId: string) => {
    await saveSelectedBranchId(optimalBranchId);
    setBranchId(optimalBranchId);
    locateAndCalculate(optimalBranchId, false);
  };

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

    if (isDeliverable === false) {
      Alert.alert(
        "Vượt quá bán kính phục vụ",
        `Vị trí nhận hàng cách chi nhánh ${distanceKm ?? ""} km, vượt quá bán kính giao hàng tối đa (15 km). Quý khách vui lòng chọn chi nhánh gần hơn hoặc cập nhật địa chỉ giao hàng.`,
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
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      distanceKm: distanceKm ?? undefined,
      note: fullNote,
      deliveryFee: deliveryFee,
      voucherCode: appliedVoucher?.voucherCode || undefined,
      items: orderItems,
    });

    if (res) {
      navigation.replace("OrderSuccess", {
        orderId: res.order.id,
        orderCode: res.order.orderCode,
        payment: res.payment,
        totalAmount: res.order.totalAmount || grandTotal,
        distanceKm: res.distanceKm ?? distanceKm ?? undefined,
        estimatedDeliveryMinutes:
          res.estimatedDeliveryMinutes ?? estimatedDeliveryMinutes ?? undefined,
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
          {/* Branch & Optimal Distance Card */}
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
                <View style={styles.branchStatusRow}>
                  <Text style={styles.cardSubtitle}>Chi nhánh phục vụ</Text>
                  {distanceKm != null && (
                    <View style={styles.distanceBadgePill}>
                      <Ionicons name="navigate" size={11} color={Colors.primary} />
                      <Text style={styles.distanceBadgeText}>{distanceKm} km</Text>
                    </View>
                  )}
                </View>
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

            {/* Distance, Delivery Time & Shipping Fee Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Ionicons name="speedometer-outline" size={16} color={Colors.secondaryGold} />
                <Text style={styles.metricLabel}>Khoảng cách</Text>
                <Text style={styles.metricValue}>
                  {distanceKm != null ? `${distanceKm} km` : isLocatingOptimal ? "Đang đo..." : "Cần GPS"}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="time-outline" size={16} color={Colors.secondaryGold} />
                <Text style={styles.metricLabel}>Giao dự kiến</Text>
                <Text style={styles.metricValue}>
                  {estimatedDeliveryMinutes != null
                    ? `~${estimatedDeliveryMinutes} phút`
                    : isLocatingOptimal
                      ? "Đang tính..."
                      : "15 - 30 phút"}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Ionicons name="bicycle-outline" size={16} color={Colors.secondaryGold} />
                <Text style={styles.metricLabel}>Cước vận chuyển</Text>
                <Text style={styles.metricValueHighlight}>
                  {formatCurrency(deliveryFee, currency)}
                </Text>
              </View>
            </View>

            {/* Out of delivery radius alert */}
            {isDeliverable === false && distanceKm != null && (
              <View style={styles.outOfRangeBanner}>
                <Ionicons name="warning" size={16} color="#B91C1C" />
                <Text style={styles.outOfRangeText}>
                  Cự ly ({distanceKm} km) vượt quá bán kính giao hàng tối đa (15 km) của chi nhánh này.
                </Text>
              </View>
            )}

            {/* Switch to nearer branch suggestion */}
            {optimalData?.branch &&
              branchId &&
              optimalData.branch.id !== branchId &&
              optimalData.isDeliverable && (
                <TouchableOpacity
                  style={styles.switchBranchSuggestion}
                  onPress={() => handleSwitchToOptimalBranch(optimalData.branch.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.switchBranchIconWrap}>
                    <Ionicons name="sparkles" size={15} color={Colors.secondaryGold} />
                  </View>
                  <View style={styles.switchBranchContent}>
                    <Text style={styles.switchBranchTitle}>
                      Chi nhánh gần bạn hơn ({optimalData.distanceKm} km)
                    </Text>
                    <Text style={styles.switchBranchSubtitle} numberOfLines={1}>
                      {optimalData.branch.branchCode} - {optimalData.branch.city} (~{optimalData.estimatedDeliveryMinutes} phút, phí ship {formatCurrency(optimalData.estimatedDeliveryFee, currency)})
                    </Text>
                  </View>
                  <View style={styles.switchBranchBtnBadge}>
                    <Text style={styles.switchBranchBtnText}>Đổi chi nhánh</Text>
                  </View>
                </TouchableOpacity>
              )}
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

            {/* GPS Auto-Locate Button */}
            <View style={styles.gpsRow}>
              <TouchableOpacity
                style={styles.gpsButton}
                onPress={handleLocateGps}
                disabled={isLocatingOptimal}
                activeOpacity={0.7}
              >
                {isLocatingOptimal ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="locate" size={16} color={Colors.primary} />
                )}
                <Text style={styles.gpsButtonText}>
                  {isLocatingOptimal ? "Đang định vị GPS..." : "Lấy vị trí GPS hiện tại"}
                </Text>
              </TouchableOpacity>

              {Boolean(userLocation?.address) && (
                <TouchableOpacity
                  style={styles.useGpsAddrBtn}
                  onPress={handleUseGpsAddress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color={Colors.secondaryGold} />
                  <Text style={styles.useGpsAddrBtnText}>Điền vào địa chỉ</Text>
                </TouchableOpacity>
              )}
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

          {/* Voucher / Promotion Card */}
          <View style={styles.card}>
            <View style={styles.cardTitleRowBetween}>
              <View style={styles.cardTitleRowNoMargin}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.cardTitle}>Mã ưu đãi & Voucher</Text>
              </View>
              {appliedVoucher && (
                <TouchableOpacity
                  onPress={() => setAppliedVoucher(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeVoucherText}>Gỡ bỏ</Text>
                </TouchableOpacity>
              )}
            </View>

            {appliedVoucher ? (
              <TouchableOpacity
                style={styles.appliedVoucherBox}
                onPress={() => setIsVoucherModalOpen(true)}
                activeOpacity={0.85}
              >
                <View style={styles.appliedVoucherLeft}>
                  <View style={styles.appliedVoucherIconBox}>
                    <Ionicons
                      name="ticket"
                      size={24}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.appliedVoucherDetails}>
                    <View style={styles.appliedVoucherHeaderRow}>
                      <Text style={styles.appliedVoucherCode}>
                        {appliedVoucher.voucherCode}
                      </Text>
                      <View style={styles.appliedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color="#166534"
                        />
                        <Text style={styles.appliedBadgeText}>Đã áp dụng</Text>
                      </View>
                    </View>
                    <Text style={styles.appliedVoucherDiscount}>
                      Giảm -{formatCurrency(appliedVoucher.discountAmount, currency)}
                    </Text>
                    {Boolean(appliedVoucher.voucherName) && (
                      <Text
                        style={styles.appliedVoucherTitle}
                        numberOfLines={1}
                      >
                        {appliedVoucher.voucherName}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.changeVoucherBtn}>
                  <Text style={styles.changeVoucherText}>Đổi</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={Colors.secondaryGold}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.selectVoucherRow}
                onPress={() => setIsVoucherModalOpen(true)}
                activeOpacity={0.7}
              >
                <View style={styles.selectVoucherPlaceholderWrap}>
                  <Text style={styles.selectVoucherPlaceholder}>
                    Chọn hoặc nhập mã ưu đãi
                  </Text>
                  <Text style={styles.selectVoucherSub}>
                    Áp dụng mã giảm giá trực tiếp vào đơn hàng
                  </Text>
                </View>
                <View style={styles.selectVoucherAction}>
                  <Text style={styles.selectVoucherActionText}>Chọn mã</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.secondaryGold}
                  />
                </View>
              </TouchableOpacity>
            )}
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
              <View style={styles.breakdownLabelWithTag}>
                <Text style={styles.breakdownLabel}>Phí giao hàng:</Text>
                {distanceKm != null && (
                  <View style={styles.distanceTag}>
                    <Text style={styles.distanceTagText}>{distanceKm} km</Text>
                  </View>
                )}
              </View>
              <Text style={styles.breakdownValue}>
                {formatCurrency(deliveryFee, currency)}
              </Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabelWithTag}>
                  <Text style={[styles.breakdownLabel, styles.discountLabel]}>
                    Ưu đãi giảm giá:
                  </Text>
                  {Boolean(appliedVoucher?.voucherCode) && (
                    <View style={styles.voucherTag}>
                      <Text style={styles.voucherTagText}>
                        {appliedVoucher?.voucherCode}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.discountValue}>
                  -{formatCurrency(discountAmount, currency)}
                </Text>
              </View>
            )}

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
            <View style={styles.footerLabelRow}>
              <Text style={styles.footerTotalLabel}>Tổng thanh toán</Text>
              {discountAmount > 0 && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>
                    Tiết kiệm {formatCurrency(discountAmount, currency)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.footerTotalPrice}>
              {formatCurrency(grandTotal, currency)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || items.length === 0 || isDeliverable === false) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleConfirmOrder}
            disabled={isSubmitting || items.length === 0 || isDeliverable === false}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.onPrimary} />
            ) : (
              <View style={styles.submitBtnContent}>
                <Text style={styles.submitButtonText}>
                  {isDeliverable === false ? "Vượt bán kính (15km)" : "Xác nhận đặt hàng"}
                </Text>
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

        {/* Voucher Selector Modal */}
        <VoucherSelectorModal
          visible={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
          orderAmount={subtotal}
          deliveryFee={deliveryFee}
          branchId={branchId}
          onApplyVoucher={(result) => setAppliedVoucher(result)}
          appliedCode={appliedVoucher?.voucherCode}
        />
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
  removeVoucherText: {
    ...Typography.labelSm,
    color: Colors.error,
    fontWeight: "600",
  },
  appliedVoucherBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  appliedVoucherLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedVoucherIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  appliedVoucherDetails: {
    flex: 1,
  },
  appliedVoucherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appliedVoucherCode: {
    ...Typography.labelLg,
    fontWeight: "800",
    color: "#166534",
    letterSpacing: 0.5,
  },
  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  appliedBadgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: "#166534",
  },
  appliedVoucherDiscount: {
    ...Typography.labelMd,
    fontWeight: "700",
    color: Colors.primaryContainer,
    marginTop: 2,
  },
  appliedVoucherTitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 1,
  },
  changeVoucherBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: Spacing.sm,
    gap: 2,
  },
  changeVoucherText: {
    ...Typography.labelMd,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
  selectVoucherRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.secondaryGold,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  selectVoucherPlaceholderWrap: {
    flex: 1,
  },
  selectVoucherPlaceholder: {
    ...Typography.bodyMd,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  selectVoucherSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  selectVoucherAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  selectVoucherActionText: {
    ...Typography.labelSm,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
  breakdownLabelWithTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountLabel: {
    color: Colors.primaryContainer,
    fontWeight: "600",
  },
  voucherTag: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  voucherTagText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: "#166534",
  },
  discountValue: {
    ...Typography.bodyMd,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  footerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savingsBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  savingsBadgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: "#166534",
  },
  branchStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distanceBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  distanceBadgeText: {
    ...Typography.labelSm,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  metricsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderSoft,
  },
  metricLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  metricValue: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  metricValueHighlight: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  outOfRangeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  outOfRangeText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: "#991B1B",
    flex: 1,
    lineHeight: 16,
  },
  switchBranchSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "#FDE047",
    gap: 8,
  },
  switchBranchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF08A",
    alignItems: "center",
    justifyContent: "center",
  },
  switchBranchContent: {
    flex: 1,
  },
  switchBranchTitle: {
    ...Typography.labelSm,
    fontSize: 11,
    fontWeight: "700",
    color: "#854D0E",
  },
  switchBranchSubtitle: {
    ...Typography.bodySm,
    fontSize: 10,
    color: "#A16207",
    marginTop: 1,
  },
  switchBranchBtnBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  switchBranchBtnText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.onPrimary,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  gpsButtonText: {
    ...Typography.labelSm,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  useGpsAddrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.secondaryGold,
  },
  useGpsAddrBtnText: {
    ...Typography.labelSm,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.secondaryGold,
  },
  distanceTag: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  distanceTagText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
  },
});
