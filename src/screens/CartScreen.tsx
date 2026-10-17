import { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import { useCart, CartItemList } from "@/features/commerce/carts";
import { getSelectedBranchId } from "@/features/territory/branches";
import { formatCurrency } from "@/common/helpers";

type CartScreenRouteProp = RouteProp<RootStackParamList, "Cart">;

export default function CartScreen() {
  const route = useRoute<CartScreenRouteProp>();
  const navigation = useNavigation();

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
    cart,
    isLoading,
    error,
    refresh,
    updateQuantity,
    removeItem,
  } = useCart(branchId, { enabled: isStorageLoaded });

  const items = useMemo(() => cart?.cartItems ?? [], [cart?.cartItems]);

  // Calculate cart summary
  const { totalQuantity, totalPrice, currency } = useMemo(() => {
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

    return { totalQuantity: qty, totalPrice: price, currency: cur };
  }, [items]);

  if (isLoading && !cart) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  if (error && !cart) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Không thể tải giỏ hàng</Text>
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
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
        <Text style={styles.emptySubtitle}>
          Hãy dạo một vòng và thêm những món bạn yêu thích vào giỏ hàng nhé!
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.browseButtonText}>Tiếp tục mua sắm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Giỏ hàng ({totalQuantity})</Text>
        {branchId && (
          <Text style={styles.headerSubtitle}>
            Chi nhánh ID: {branchId.slice(0, 8)}...
          </Text>
        )}
      </View>

      <View style={styles.listContainer}>
        <CartItemList
          cart={cart ?? undefined}
          refreshing={isLoading}
          onRefresh={refresh}
          onUpdateQuantity={(productId, qty) => updateQuantity(productId, qty)}
          onRemoveItem={(productId) => removeItem(productId)}
        />
      </View>

      {/* Checkout Summary Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Tổng cộng ({totalQuantity} món)</Text>
          <Text style={styles.totalPrice}>
            {formatCurrency(totalPrice, currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>Đặt hàng</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  listContainer: {
    flex: 1,
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
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#007AFF",
  },
  checkoutButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
