import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useWishlist, WishlistItemList } from "@/features/commerce/wishlists";
import { useCart } from "@/features/commerce/carts";
import { getSelectedBranchId } from "@/features/territory/branches";
import { Product } from "@/features/catalog/products";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type WishlistScreenRouteProp = RouteProp<RootStackParamList, "Wishlist">;
type WishlistScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Wishlist"
>;

export default function WishlistScreen() {
  const route = useRoute<WishlistScreenRouteProp>();
  const navigation = useNavigation<WishlistScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const routeBranchId = route.params?.branchId ?? null;
  const [branchId, setBranchId] = useState<string | null>(routeBranchId);
  const [isStorageLoaded, setIsStorageLoaded] = useState(Boolean(routeBranchId));

  // Load branch ID from storage if not passed in route
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

  const {
    wishlist,
    isLoading,
    isMovingAll,
    error,
    refresh,
    removeItem,
    moveAllToCart,
  } = useWishlist(branchId, { enabled: isStorageLoaded });

  const { cart, addItem: addToCart } = useCart(branchId);
  const cartCount = cart?.cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  const items = wishlist?.wishlistItems || wishlist?.items || [];

  const handleAddToCart = async (product: Product) => {
    const success = await addToCart(product.id);
    if (success) {
      Alert.alert("Thành công", `Đã thêm "${product.name}" vào giỏ hàng ẩm thực.`);
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate("ProductDetail", {
      productId: product.id,
      product,
      branchId,
    });
  };

  const handleMoveAllToCart = () => {
    if (items.length === 0 || isMovingAll) return;

    Alert.alert(
      "Chuyển vào giỏ hàng",
      `Bạn có muốn chuyển tất cả ${items.length} món yêu thích vào giỏ hàng không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            const res = await moveAllToCart();
            if (res.success) {
              Alert.alert(
                "Thành công",
                "Đã chuyển tất cả món ăn vào giỏ hàng!",
                [
                  { text: "Ở lại", style: "cancel" },
                  {
                    text: "Xem giỏ hàng",
                    onPress: () => navigation.navigate("Cart", { branchId }),
                  },
                ],
              );
            } else {
              Alert.alert(
                "Lỗi",
                res.error || "Không thể chuyển món ăn vào giỏ hàng.",
              );
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
        subtitle="DANH SÁCH YÊU THÍCH"
        showBack={navigation.canGoBack()}
        cartCount={cartCount}
        onCartPress={() => navigation.navigate("Cart", { branchId })}
      />

      {isLoading && !wishlist ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
          <Text style={styles.loadingText}>Đang tải danh sách món yêu thích...</Text>
        </View>
      ) : error && !wishlist ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Không thể tải danh sách yêu thích</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refresh()} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={16} color={Colors.onPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-dislike-outline" size={40} color={Colors.secondaryGold} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có món ăn yêu thích</Text>
          <Text style={styles.emptySubtitle}>
            Khám phá thực đơn thượng hạng của Haute De Hallen và lưu lại những phong vị tuyệt hảo bạn yêu thích.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Menu", { branchId })}
            activeOpacity={0.85}
          >
            <Ionicons name="restaurant-outline" size={16} color={Colors.onPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.browseButtonText}>Khám phá thực đơn</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {/* Subheader info bar */}
          <View style={styles.subHeader}>
            <View style={styles.subHeaderLeft}>
              <Ionicons name="heart" size={16} color={Colors.primaryContainer} />
              <Text style={styles.subHeaderCount}>
                {items.length} món ẩm thực tinh tuyển
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewCartLink}
              onPress={() => navigation.navigate("Cart", { branchId })}
              activeOpacity={0.7}
            >
              <Text style={styles.viewCartLinkText}>Giỏ hàng ({cartCount})</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.secondaryGold} />
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            <WishlistItemList
              wishlist={wishlist}
              refreshing={isLoading}
              onRefresh={refresh}
              onRemoveItem={(productId) => removeItem(productId)}
              onAddToCart={handleAddToCart}
              onProductPress={handleProductPress}
            />
          </View>

          {/* Bottom Bar: Move All to Cart */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) + 8 },
            ]}
          >
            <View style={styles.bottomInfo}>
              <Text style={styles.bottomCountText}>{items.length} món đã lưu</Text>
              <Text style={styles.bottomHintText}>Chuyển toàn bộ vào bàn tiệc</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.moveAllButton,
                isMovingAll && styles.moveAllButtonDisabled,
              ]}
              onPress={handleMoveAllToCart}
              disabled={isMovingAll}
              activeOpacity={0.85}
            >
              {isMovingAll ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <>
                  <Ionicons
                    name="bag-handle"
                    size={18}
                    color={Colors.onPrimary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.moveAllButtonText}>Chuyển tất cả vào giỏ</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  subHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subHeaderCount: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  viewCartLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewCartLinkText: {
    ...Typography.labelSm,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
  listContainer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(252, 249, 243, 0.98)",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.floating,
  },
  bottomInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  bottomCountText: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  bottomHintText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  moveAllButton: {
    backgroundColor: Colors.primaryContainer,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    ...Shadows.subtle,
  },
  moveAllButtonDisabled: {
    backgroundColor: Colors.surfaceContainer,
  },
  moveAllButtonText: {
    ...Typography.labelSm,
    color: Colors.onPrimary,
    fontWeight: "700",
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
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    ...Shadows.subtle,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    ...Shadows.subtle,
  },
  browseButtonText: {
    ...Typography.labelSm,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
});
