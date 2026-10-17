import { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useProducts } from "@/features/catalog/products/hooks/useProducts";
import { ProductList } from "@/features/catalog/products/components/ProductList";
import { useCategories, CategoryDropdown } from "@/features/catalog/categories";
import { getSelectedBranchId } from "@/features/territory/branches";

type MenuScreenRouteProp = RouteProp<RootStackParamList, "Menu">;
type MenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Menu"
>;

export default function MenuScreen() {
  const route = useRoute<MenuScreenRouteProp>();
  const navigation = useNavigation<MenuScreenNavigationProp>();

  const [prevParams, setPrevParams] = useState(route.params);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    route.params?.categoryId ?? null,
  );

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    route.params?.branchId ?? null,
  );

  // Sync state during render when route.params change (e.g. from Home quick navigation)
  if (route.params !== prevParams) {
    setPrevParams(route.params);
    if (route.params?.categoryId !== undefined) {
      setSelectedCategoryId(route.params.categoryId);
    }
    if (route.params?.branchId !== undefined) {
      setSelectedBranchId(route.params.branchId);
    }
  }

  // Load branch ID from storage if not explicitly passed in route params
  useEffect(() => {
    let isMounted = true;
    if (!route.params?.branchId) {
      getSelectedBranchId().then((storedId) => {
        if (isMounted && storedId) {
          setSelectedBranchId(storedId);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [route.params?.branchId]);

  const { categories } = useCategories();

  // Fetch products from api/catalog/products with active filters
  const {
    products,
    isLoading: isProductsLoading,
    error: productsError,
    refresh: refreshProducts,
  } = useProducts({
    categoryId: selectedCategoryId,
    branchId: selectedBranchId,
  });

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const hasActiveFilter = Boolean(selectedCategoryId);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Thực đơn</Text>
        <View style={styles.headerButtonRow}>
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={() =>
              navigation.navigate("Wishlist", { branchId: selectedBranchId })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.headerButtonText}>❤️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartButton}
            onPress={() =>
              navigation.navigate("Cart", { branchId: selectedBranchId })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.headerButtonText}>🛒 Giỏ hàng</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Bar with Category Dropdowns */}
      <View style={styles.filterContainer}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Danh mục</Text>
          <CategoryDropdown
            categories={categories}
            value={selectedCategoryId}
            onSelect={(id) => setSelectedCategoryId(id)}
          />
        </View>
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilter && (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterLabel}>Đang lọc:</Text>
          {Boolean(selectedCategoryId && activeCategory) && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{activeCategory?.name}</Text>
              <TouchableOpacity
                onPress={() => setSelectedCategoryId(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.filterChipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              setSelectedCategoryId(null);
            }}
          >
            <Text style={styles.clearAllText}>Xóa tất cả</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error message */}
      {Boolean(productsError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{productsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refreshProducts()}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Product List */}
      <ProductList
        products={products}
        isLoading={isProductsLoading}
        refreshing={isProductsLoading}
        onRefresh={refreshProducts}
        onProductPress={(product) =>
          navigation.navigate("ProductDetail", {
            productId: product.id,
            product,
            branchId: selectedBranchId,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerButtonRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  wishlistButton: {
    backgroundColor: "#EC4899",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  cartButton: {
    backgroundColor: "#10B981",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  filterItem: {
    flex: 1,
    gap: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  activeFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  activeFilterLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "500",
  },
  filterChipClose: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "bold",
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
  },
  errorContainer: {
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
