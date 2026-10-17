import { useState, useEffect } from "react";
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
import { RootStackParamList } from "@/navigation/types";
import { useWishlist, WishlistItemList } from "@/features/commerce/wishlists";
import { useCart } from "@/features/commerce/carts";
import { getSelectedBranchId } from "@/features/territory/branches";
import { Product } from "@/features/catalog/products";

type WishlistScreenRouteProp = RouteProp<RootStackParamList, "Wishlist">;
type WishlistScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Wishlist"
>;

export default function WishlistScreen() {
  const route = useRoute<WishlistScreenRouteProp>();
  const navigation = useNavigation<WishlistScreenNavigationProp>();

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

  const { addItem: addToCart } = useCart(branchId);

  const items = wishlist?.wishlistItems || wishlist?.items || [];

  const handleAddToCart = async (product: Product) => {
    const success = await addToCart(product.id);
    if (success) {
      Alert.alert("Thành công", `Đã thêm "${product.name}" vào giỏ hàng.`);
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
      `Bạn có muốn chuyển tất cả ${items.length} sản phẩm yêu thích vào giỏ hàng không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            const res = await moveAllToCart();
            if (res.success) {
              Alert.alert(
                "Thành công",
                "Đã chuyển tất cả sản phẩm vào giỏ hàng!",
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
                res.error || "Không thể chuyển sản phẩm vào giỏ hàng.",
              );
            }
          },
        },
      ],
    );
  };

  if (isLoading && !wishlist) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
      </View>
    );
  }

  if (error && !wishlist) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Không thể tải danh sách yêu thích</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refresh()}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>❤️</Text>
        <Text style={styles.emptyTitle}>Danh sách yêu thích trống</Text>
        <Text style={styles.emptySubtitle}>
          Hãy lưu lại những món bạn yêu thích để dễ dàng tìm kiếm và đặt hàng sau nhé!
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate("Menu", { branchId })}
          activeOpacity={0.8}
        >
          <Text style={styles.browseButtonText}>Khám phá thực đơn</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>
            Sản phẩm yêu thích ({items.length})
          </Text>
          {branchId && (
            <Text style={styles.headerSubtitle}>
              Chi nhánh ID: {branchId.slice(0, 8)}...
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.headerCartButton}
          onPress={() => navigation.navigate("Cart", { branchId })}
          activeOpacity={0.7}
        >
          <Text style={styles.headerCartIcon}>🛒</Text>
          <Text style={styles.headerCartText}>Giỏ hàng</Text>
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
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomCountText}>{items.length} món đã lưu</Text>
          <Text style={styles.bottomHintText}>Chuyển vào giỏ để thanh toán</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.moveAllButton,
            isMovingAll && styles.moveAllButtonDisabled,
          ]}
          onPress={handleMoveAllToCart}
          disabled={isMovingAll}
          activeOpacity={0.8}
        >
          {isMovingAll ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.moveAllButtonIcon}>🛒</Text>
              <Text style={styles.moveAllButtonText}>Chuyển tất cả vào giỏ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  headerCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  headerCartIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  headerCartText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  listContainer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomCountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  bottomHintText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  moveAllButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  moveAllButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  moveAllButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  moveAllButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
  errorIcon: {
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
    fontWeight: "600",
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  browseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

