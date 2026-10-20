import React, { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useCart, CartItemList } from "@/features/commerce/carts";
import { getSelectedBranchId, useBranches } from "@/features/territory/branches";
import { useAuthContext } from "@/features/auth";
import { formatCurrency } from "@/common/helpers";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type CartScreenRouteProp = RouteProp<RootStackParamList, "Cart">;
type CartNavProp = NativeStackNavigationProp<RootStackParamList, "Cart">;

export default function CartScreen() {
  const route = useRoute<CartScreenRouteProp>();
  const navigation = useNavigation<CartNavProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();

  const routeBranchId = route.params?.branchId ?? null;
  const [branchId, setBranchId] = useState<string | null>(routeBranchId);
  const [isStorageLoaded, setIsStorageLoaded] = useState(Boolean(routeBranchId));

  // Fulfillment mode: 'delivery' | 'pickup'
  const [fulfillmentMode, setFulfillmentMode] = useState<"delivery" | "pickup">("delivery");

  // Order notes (real user input for the kitchen)
  const [orderNote, setOrderNote] = useState("");

  // Load branches from API
  const { branches } = useBranches();

  // Load branch ID from storage if not in route
  useEffect(() => {
    let isMounted = true;
    if (!routeBranchId) {
      getSelectedBranchId().then((storedId) => {
        if (isMounted) {
          if (storedId) {
            setBranchId(storedId);
          }
          setIsStorageLoaded(true);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [routeBranchId]);

  const currentBranch = useMemo(() => {
    if (!branches || branches.length === 0) return null;
    if (branchId) {
      const found = branches.find((b) => b.id === branchId);
      if (found) return found;
    }
    return branches[0];
  }, [branches, branchId]);

  const {
    cart,
    isLoading,
    error,
    refresh,
    updateQuantity,
    removeItem,
  } = useCart(branchId, { enabled: isStorageLoaded });

  const items = useMemo(() => cart?.cartItems ?? [], [cart?.cartItems]);

  // Calculate cart summary strictly from API items
  const { totalQuantity, subtotalPrice, currency } = useMemo(() => {
    let qty = 0;
    let price = 0;
    let cur = "₫";

    for (const item of items) {
      qty += item.quantity;
      if (item.product?.unitPrice) {
        price += item.product.unitPrice * item.quantity;
      }
      if (item.product?.currency) {
        cur = item.product.currency;
      }
    }

    return { totalQuantity: qty, subtotalPrice: price, currency: cur };
  }, [items]);

  // Dynamic user delivery address from auth API
  const userAddress = useMemo(() => {
    if (!user?.personalProfile) return "";
    const parts = [
      user.personalProfile.address,
      user.personalProfile.city,
    ].filter(Boolean);
    return parts.join(", ");
  }, [user]);

  const customerName = useMemo(() => {
    if (!user) return "";
    const name = [user.personalProfile?.lastName, user.personalProfile?.firstName]
      .filter(Boolean)
      .join(" ");
    return name || user.userName || "";
  }, [user]);

  const handleClearAll = () => {
    Alert.alert(
      "Xác nhận",
      "Quý khách có chắc chắn muốn xóa toàn bộ món trong giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: async () => {
            for (const it of items) {
              const pid = it.product?.id || it.productId || it.id;
              if (pid) await removeItem(pid);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="GIỎ HÀNG & THANH TOÁN"
        cartCount={totalQuantity}
        showBack={navigation.canGoBack()}
      />

      {isLoading && !cart ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      ) : error && !cart ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Không thể tải giỏ hàng</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refresh()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bag-handle-outline" size={46} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
          <Text style={styles.emptySubtitle}>
            Khám phá thực đơn thượng hạng của Haute De Hallen và chọn món ngon cho bữa tiệc của bạn.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Menu", { branchId })}
            activeOpacity={0.85}
          >
            <Text style={styles.browseButtonText}>Xem thực đơn ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={Colors.primaryContainer}
              colors={[Colors.primaryContainer]}
            />
          }
        >
          {/* Header row: title + ETA + clear all */}
          <View style={styles.headerInfoRow}>
            <View>
              <Text style={styles.cartTitle}>Giỏ hàng của bạn</Text>
              <View style={styles.etaRow}>
                <Ionicons name="time-outline" size={14} color={Colors.secondaryGold} />
                <Text style={styles.etaText}>
                  Thời gian dự kiến:{" "}
                  <Text style={styles.etaBold}>30 - 45 phút</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.outline} />
              <Text style={styles.clearBtnText}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>

          {/* Fulfillment mode segmented pill */}
          <View style={styles.modeSegment}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                fulfillmentMode === "delivery" && styles.modeBtnActive,
              ]}
              onPress={() => setFulfillmentMode("delivery")}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="moped"
                size={18}
                color={
                  fulfillmentMode === "delivery"
                    ? Colors.onPrimary
                    : Colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.modeBtnText,
                  fulfillmentMode === "delivery" && styles.modeBtnTextActive,
                ]}
              >
                Giao hàng tận nơi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                fulfillmentMode === "pickup" && styles.modeBtnActive,
              ]}
              onPress={() => setFulfillmentMode("pickup")}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={18}
                color={
                  fulfillmentMode === "pickup"
                    ? Colors.onPrimary
                    : Colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.modeBtnText,
                  fulfillmentMode === "pickup" && styles.modeBtnTextActive,
                ]}
              >
                Lấy tại nhà hàng
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Address Banner */}
          <View style={styles.addressCard}>
            <View style={styles.addressLeft}>
              <View style={styles.addressIconWrap}>
                <Ionicons
                  name={fulfillmentMode === "delivery" ? "location" : "storefront"}
                  size={18}
                  color={Colors.primaryContainer}
                />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressTitle}>
                  {fulfillmentMode === "delivery"
                    ? customerName
                      ? `Giao tới: ${customerName}`
                      : "Địa chỉ nhận món"
                    : currentBranch?.branchCode || currentBranch?.city || "Chi nhánh Haute De Hallen"}
                </Text>
                <Text style={styles.addressSub} numberOfLines={2}>
                  {fulfillmentMode === "delivery"
                    ? userAddress ||
                      "Chưa có địa chỉ. Quý khách vui lòng cung cấp khi thanh toán."
                    : currentBranch?.address
                      ? currentBranch.address
                      : "Địa chỉ chi nhánh đang phục vụ"}
                </Text>
              </View>
            </View>
            {fulfillmentMode === "delivery" && !userAddress && (
              <TouchableOpacity
                onPress={() => navigation.navigate("Profile")}
                activeOpacity={0.7}
              >
                <Text style={styles.addressChangeText}>Thêm</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Dishes Header */}
          <View style={styles.dishListHeader}>
            <Text style={styles.dishListTitle}>
              Món ăn đã chọn ({totalQuantity})
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Menu", { branchId })}
              style={styles.addMoreRow}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addMoreText}>Thêm món khác</Text>
            </TouchableOpacity>
          </View>

          {/* Dish list items */}
          <CartItemList
            cart={cart ?? undefined}
            onUpdateQuantity={(productId, qty) => updateQuantity(productId, qty)}
            onRemoveItem={(productId) => removeItem(productId)}
          />

          {/* Order Note for Kitchen & Staff */}
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Ghi chú cho Bếp & Phục vụ</Text>
            <View style={styles.noteInputWrap}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={18}
                color={Colors.outline}
                style={styles.noteIcon}
              />
              <TextInput
                style={styles.noteInput}
                placeholder="Yêu cầu dị ứng, khẩu vị, gia vị riêng..."
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
                value={orderNote}
                onChangeText={setOrderNote}
              />
            </View>
          </View>

          {/* Payment calculation breakdown */}
          <View style={styles.calcCard}>
            <Text style={styles.calcHeading}>Chi tiết thanh toán</Text>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Tạm tính món ăn ({totalQuantity} món)</Text>
              <Text style={styles.calcValue}>
                {formatCurrency(subtotalPrice, currency)}
              </Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Hình thức phục vụ</Text>
              <Text style={styles.calcValue}>
                {fulfillmentMode === "delivery" ? "Giao hàng tận nơi" : "Lấy tại nhà hàng"}
              </Text>
            </View>

            {Boolean(currentBranch) && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Chi nhánh phục vụ</Text>
                <Text style={styles.calcValue}>
                  {currentBranch?.branchCode || currentBranch?.city}
                </Text>
              </View>
            )}

            <View style={styles.calcTotalRow}>
              <View>
                <Text style={styles.calcTotalLabel}>Tổng thanh toán</Text>
                <Text style={styles.calcVatNote}>(Đã bao gồm thuế GTGT & phí dịch vụ)</Text>
              </View>
              <Text style={styles.calcTotalPrice}>
                {formatCurrency(subtotalPrice, currency)}
              </Text>
            </View>
          </View>

          {/* Warm assurance notice */}
          <View style={styles.assuranceBox}>
            <MaterialIcons
              name="verified-user"
              size={20}
              color={Colors.secondaryGold}
            />
            <Text style={styles.assuranceText}>
              Món ăn được chế biến tươi nóng theo tiêu chuẩn ẩm thực Haute De Hallen.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Sticky Bottom Checkout Action Bar */}
      {items.length > 0 && (
        <View
          style={[
            styles.stickyCheckoutBar,
            { bottom: insets.bottom + 60 },
          ]}
        >
          <View style={styles.stickyCheckoutContent}>
            <View>
              <Text style={styles.stickyTotalSub}>
                Tổng thanh toán ({totalQuantity} món)
              </Text>
              <Text style={styles.stickyTotalPrice}>
                {formatCurrency(subtotalPrice, currency)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate("Checkout", { branchId })}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutBtnText}>Tiến hành thanh toán</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating Bottom Nav Bar */}
      <HauteBottomBar activeTab="Cart" cartCount={totalQuantity} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Header row
  headerInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  cartTitle: {
    ...Typography.headlineLg,
    fontSize: 22,
    color: Colors.onSurface,
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  etaText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  etaBold: {
    fontWeight: "700",
    color: Colors.onSurface,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
  },
  clearBtnText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },

  // Fulfillment mode segment
  modeSegment: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    padding: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  modeBtnActive: {
    backgroundColor: Colors.primaryContainer,
    ...Shadows.subtle,
  },
  modeBtnText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  modeBtnTextActive: {
    color: Colors.onPrimary,
    fontWeight: "700",
  },

  // Address Banner
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.lg,
    ...Shadows.subtle,
  },
  addressLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    marginRight: 8,
  },
  addressIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(158, 60, 43, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  addressSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  addressChangeText: {
    ...Typography.labelMd,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },

  // Dish list header
  dishListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  dishListTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
  },
  addMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  addMoreText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Order note section
  noteSection: {
    marginVertical: Spacing.md,
  },
  noteLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  noteInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    height: 48,
    ...Shadows.subtle,
  },
  noteIcon: {
    marginRight: 8,
  },
  noteInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    height: "100%",
  },

  // Calculation Breakdown
  calcCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
    marginBottom: Spacing.md,
  },
  calcHeading: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calcRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calcLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  calcValue: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontWeight: "500",
  },
  calcTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.borderSoft,
  },
  calcTotalLabel: {
    ...Typography.headlineSm,
    fontSize: 16,
    color: Colors.onSurface,
  },
  calcVatNote: {
    fontSize: 10,
    color: Colors.outline,
    marginTop: 1,
  },
  calcTotalPrice: {
    ...Typography.headlineLg,
    fontSize: 22,
    color: Colors.primaryContainer,
    fontWeight: "700",
  },

  // Assurance Notice
  assuranceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  assuranceText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.tertiary,
    flex: 1,
    lineHeight: 17,
  },

  // Sticky Checkout Action Bar
  stickyCheckoutBar: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 45,
  },
  stickyCheckoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLowest,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.elevated,
  },
  stickyTotalSub: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  stickyTotalPrice: {
    ...Typography.headlineSm,
    fontSize: 16,
    color: Colors.primaryContainer,
    fontWeight: "700",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    ...Shadows.card,
  },
  checkoutBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: "700",
  },

  // Center / Empty
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  loadingText: {
    marginTop: 12,
    ...Typography.bodySm,
    color: Colors.outline,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.onSurface,
    marginBottom: 6,
  },
  emptySubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 280,
  },
  browseButton: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    ...Shadows.card,
  },
  browseButtonText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  errorTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.error,
    marginBottom: 6,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
  },
  retryButtonText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: "600",
  },
});
