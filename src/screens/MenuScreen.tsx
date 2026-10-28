import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useProducts } from "@/features/catalog/products/hooks/useProducts";
import { ProductCard } from "@/features/catalog/products/components/ProductCard";
import { useCategories } from "@/features/catalog/categories";
import { useCart } from "@/features/commerce/carts";
import { useWishlist } from "@/features/commerce/wishlists";
import { getSelectedBranchId } from "@/features/territory/branches";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { formatCurrency } from "@/common/helpers";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";
import { Product } from "@/features/catalog/products";

type MenuScreenRouteProp = RouteProp<RootStackParamList, "Menu">;
type MenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Menu"
>;

// Product filter types from backend (Mặc định | Đề xuất | Xu hướng)
const PRODUCT_TYPE_OPTIONS = [
  { id: "default", label: "Mặc định", icon: "restaurant-outline" },
  { id: "recommended", label: "Đề xuất", icon: "sparkles" },
  { id: "trending", label: "Xu hướng", icon: "flame" },
] as const;

type ProductTypeOption = (typeof PRODUCT_TYPE_OPTIONS)[number]["id"];

// Dynamic sort options for API products
const SORT_OPTIONS = [
  { id: "default", label: "Mặc định", icon: "swap-vertical" },
  { id: "price_asc", label: "Giá tăng dần", icon: "arrow-up" },
  { id: "price_desc", label: "Giá giảm dần", icon: "arrow-down" },
  { id: "name_asc", label: "Tên A-Z", icon: "text" },
];

export default function MenuScreen() {
  const route = useRoute<MenuScreenRouteProp>();
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    route.params?.categoryId ?? null,
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    route.params?.branchId ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("default");
  const [productType, setProductType] = useState<ProductTypeOption>("default");
  const flashListRef = useRef<any>(null);

  // Sync state when route params change
  useEffect(() => {
    if (route.params?.categoryId !== undefined) {
      setSelectedCategoryId(route.params.categoryId);
    }
    if (route.params?.branchId !== undefined) {
      setSelectedBranchId(route.params.branchId);
    }
  }, [route.params?.categoryId, route.params?.branchId]);

  // Load branch ID from storage if needed
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

  // Fetch products from backend with pagination & type filter
  const {
    products,
    isLoading: isProductsLoading,
    error: productsError,
    page,
    setPage,
    totalPages,
    totalItems,
    refresh: refreshProducts,
  } = useProducts({
    categoryId: selectedCategoryId,
    branchId: selectedBranchId,
    type: productType === "default" ? undefined : productType,
    page: 1,
    pageSize: 12,
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
        setPage(newPage);
        flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    },
    [page, totalPages, setPage],
  );

  // Cart integration
  const { cart, addItem } = useCart(selectedBranchId);

  // Wishlist integration
  const { isInWishlist, toggleItem: toggleWishlist } = useWishlist(selectedBranchId);

  const cartTotalQty = useMemo(() => {
    return cart?.cartItems?.reduce((acc, it) => acc + it.quantity, 0) ?? 0;
  }, [cart?.cartItems]);

  const cartTotalPrice = useMemo(() => {
    return (
      cart?.cartItems?.reduce(
        (acc, it) => acc + (it.product?.unitPrice || 0) * it.quantity,
        0,
      ) ?? 0
    );
  }, [cart?.cartItems]);

  // Filter products by search text and apply dynamic sort strictly on API data
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q),
      );
    }

    if (activeSort === "price_asc") {
      list.sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0));
    } else if (activeSort === "price_desc") {
      list.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0));
    } else if (activeSort === "name_asc") {
      list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    return list;
  }, [products, searchQuery, activeSort]);

  const handleAddToCart = async (product: Product) => {
    await addItem(product.id, selectedBranchId, product);
  };

  const renderHeader = useCallback(
    () => (
      <View>
        {/* Search Bar & Tune Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <Ionicons
              name="search-outline"
              size={18}
              color={Colors.outline}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm món ăn, dimsum, lẩu..."
              placeholderTextColor="rgba(138, 114, 109, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={Colors.outline}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lựa chọn loại món: Mặc định | Đề xuất | Xu hướng */}
        <View style={styles.productTypeContainer}>
          {PRODUCT_TYPE_OPTIONS.map((opt) => {
            const isSelected = productType === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.productTypeTab,
                  isSelected && styles.productTypeTabActive,
                ]}
                onPress={() => {
                  setProductType(opt.id);
                  setPage(1);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={15}
                  color={isSelected ? "#FFFFFF" : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.productTypeTabText,
                    isSelected && styles.productTypeTabTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Sort Options */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFilterReel}
        >
          {SORT_OPTIONS.map((s) => {
            const isActive = activeSort === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setActiveSort(s.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={s.icon as any}
                  size={14}
                  color={isActive ? Colors.primaryContainer : Colors.outline}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Categories Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabReel}
        >
          <TouchableOpacity
            style={[
              styles.categoryTab,
              selectedCategoryId === null && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategoryId(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryTabText,
                selectedCategoryId === null && styles.categoryTabTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isCatActive = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTab,
                  isCatActive && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    isCatActive && styles.categoryTabTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Heading */}
        <View style={styles.menuHeaderRow}>
          <View>
            <Text style={styles.menuHeaderTitle}>Tinh hoa Ẩm thực</Text>
            <Text style={styles.menuHeaderSubtitle}>
              Tuyển chọn nghệ thuật ẩm thực đương đại từ Bếp trưởng
            </Text>
          </View>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>
              {totalItems > 0 ? `${totalItems} Món` : `${filteredProducts.length} Món`}
            </Text>
          </View>
        </View>

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

        {/* Loading Indicator */}
        {isProductsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.primaryContainer}
            />
            <Text style={styles.loadingText}>Đang tải món ăn...</Text>
          </View>
        )}
      </View>
    ),
    [
      searchQuery,
      productType,
      activeSort,
      selectedCategoryId,
      categories,
      filteredProducts.length,
      totalItems,
      productsError,
      isProductsLoading,
      refreshProducts,
      setPage,
    ],
  );

  const renderPagination = useCallback(() => {
    if (isProductsLoading || filteredProducts.length === 0) return null;

    return (
      <View style={styles.paginationWrapper}>
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationInfoText}>
            Hiển thị {(page - 1) * 12 + 1} - {Math.min(page * 12, totalItems || filteredProducts.length)} trên tổng {totalItems || filteredProducts.length} món
          </Text>
        </View>

        <View style={styles.paginationControls}>
          {/* Previous Button */}
          <TouchableOpacity
            style={[
              styles.pageNavBtn,
              page <= 1 && styles.pageNavBtnDisabled,
            ]}
            disabled={page <= 1}
            onPress={() => handlePageChange(page - 1)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={page <= 1 ? Colors.outlineVariant : Colors.onSurface}
            />
            <Text
              style={[
                styles.pageNavBtnText,
                page <= 1 && styles.pageNavBtnTextDisabled,
              ]}
            >
              Trước
            </Text>
          </TouchableOpacity>

          {/* Page Number Chips */}
          <View style={styles.pageNumbersRow}>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<number[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  acc.push(-1); // ellipsis marker
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => {
                if (p === -1) {
                  return (
                    <Text key={`ellipsis-${idx}`} style={styles.pageEllipsis}>
                      …
                    </Text>
                  );
                }
                const isActive = p === page;
                return (
                  <TouchableOpacity
                    key={`page-${p}`}
                    style={[
                      styles.pageNumberBtn,
                      isActive && styles.pageNumberBtnActive,
                    ]}
                    onPress={() => handlePageChange(p)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.pageNumberText,
                        isActive && styles.pageNumberTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.pageNavBtn,
              page >= totalPages && styles.pageNavBtnDisabled,
            ]}
            disabled={page >= totalPages}
            onPress={() => handlePageChange(page + 1)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pageNavBtnText,
                page >= totalPages && styles.pageNavBtnTextDisabled,
              ]}
            >
              Sau
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={page >= totalPages ? Colors.outlineVariant : Colors.onSurface}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    isProductsLoading,
    filteredProducts.length,
    page,
    totalPages,
    totalItems,
    handlePageChange,
  ]);

  const renderEmpty = useCallback(() => {
    if (isProductsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="restaurant-outline"
          size={48}
          color={Colors.outline}
        />
        <Text style={styles.emptyTitle}>Chưa tìm thấy món ăn phù hợp</Text>
        <Text style={styles.emptySubtitle}>
          Quý khách vui lòng thử tìm kiếm với từ khóa hoặc danh mục khác.
        </Text>
      </View>
    );
  }, [isProductsLoading]);

  return (
    <View style={styles.screenWrapper}>
      {/* Top App Bar */}
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="FINE ASIAN DINING"
        cartCount={cartTotalQty}
        onCartPress={() =>
          navigation.navigate("Cart", { branchId: selectedBranchId })
        }
      />

      <View style={styles.scrollContainer}>
        <FlashList
          ref={flashListRef}
          data={isProductsLoading ? [] : filteredProducts}
          renderItem={({ item: product }) => (
            <View style={styles.productCardWrapper}>
              <ProductCard
                product={product}
                onAddToCart={handleAddToCart}
                isWishlisted={isInWishlist(product.id)}
                onToggleWishlist={toggleWishlist}
                onPress={(p) =>
                  navigation.navigate("ProductDetail", {
                    productId: p.id,
                    product: p,
                    branchId: selectedBranchId,
                  })
                }
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderPagination}
          contentContainerStyle={{
            paddingBottom: insets.bottom + (cartTotalQty > 0 ? 150 : 90),
            paddingTop: Spacing.sm,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Sticky Floating Cart Summary (Hovering above BottomNavBar) */}
      {cartTotalQty > 0 && (
        <View
          style={[
            styles.floatingCartBar,
            { bottom: insets.bottom + 65 },
          ]}
        >
          <TouchableOpacity
            style={styles.floatingCartContent}
            onPress={() =>
              navigation.navigate("Cart", { branchId: selectedBranchId })
            }
            activeOpacity={0.9}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartIconWrap}>
                <Ionicons name="bag-handle" size={18} color="#FFFFFF" />
                <View style={styles.floatingCartBadge}>
                  <Text style={styles.floatingCartBadgeText}>
                    {cartTotalQty}
                  </Text>
                </View>
              </View>
              <View>
                <Text style={styles.floatingCartSubtitle}>
                  Giỏ món ăn ({cartTotalQty} món)
                </Text>
                <Text style={styles.floatingCartTotal}>
                  {formatCurrency(cartTotalPrice, "₫")}
                </Text>
              </View>
            </View>

            <View style={styles.floatingCartBtn}>
              <Text style={styles.floatingCartBtnText}>Xem giỏ</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Bottom Nav Bar */}
      <HauteBottomBar activeTab="Menu" cartCount={cartTotalQty} />
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
    paddingTop: Spacing.sm,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    height: "100%",
  },

  // Product Type Segmented Control (Mặc định | Đề xuất | Xu hướng)
  productTypeContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    padding: 3,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  productTypeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  productTypeTabActive: {
    backgroundColor: Colors.primaryContainer,
    ...Shadows.subtle,
  },
  productTypeTabText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.onSurfaceVariant,
  },
  productTypeTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Quick Filter Reel
  quickFilterReel: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    paddingVertical: 6,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.primaryContainer,
  },
  filterPillText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: Colors.primaryContainer,
    fontWeight: "700",
  },

  // Category Tab Reel
  categoryTabReel: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: Colors.borderSoft,
  },
  categoryTab: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categoryTabActive: {
    borderBottomColor: Colors.primaryContainer,
  },
  categoryTabText: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
  },
  categoryTabTextActive: {
    color: Colors.primaryContainer,
    fontWeight: "700",
  },

  // Menu Header Row
  menuHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  menuHeaderTitle: {
    ...Typography.headlineLg,
    fontSize: 22,
    color: Colors.primary,
  },
  menuHeaderSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  itemCountBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  itemCountText: {
    ...Typography.labelSm,
    color: Colors.onSecondaryFixed,
    fontWeight: "700",
  },

  // Products
  productsList: {
    paddingHorizontal: Spacing.lg,
  },
  productCardWrapper: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    ...Typography.bodySm,
    color: Colors.outline,
  },
  emptyContainer: {
    paddingVertical: 50,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    color: Colors.onSurface,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  errorContainer: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
    flex: 1,
  },
  retryButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginLeft: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  // Pagination Controls
  paginationWrapper: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  paginationInfo: {
    marginBottom: Spacing.sm,
  },
  paginationInfoText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  pageNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
    backgroundColor: Colors.surfaceContainer,
  },
  pageNavBtnText: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  pageNavBtnTextDisabled: {
    color: Colors.outlineVariant,
  },
  pageNumbersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginHorizontal: 4,
  },
  pageNumberBtn: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  pageNumberBtnActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  pageNumberText: {
    ...Typography.labelSm,
    fontWeight: "600",
    color: Colors.onSurface,
  },
  pageNumberTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  pageEllipsis: {
    paddingHorizontal: 4,
    color: Colors.outline,
    fontSize: 14,
    fontWeight: "700",
  },

  // Sticky Floating Cart Bar
  floatingCartBar: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 45,
  },
  floatingCartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.inverseSurface,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    ...Shadows.elevated,
  },
  floatingCartLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  floatingCartIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  floatingCartBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: Colors.secondaryFixed,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  floatingCartBadgeText: {
    color: Colors.onSecondaryFixed,
    fontSize: 9,
    fontWeight: "800",
  },
  floatingCartSubtitle: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.inversePrimary,
  },
  floatingCartTotal: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  floatingCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
  },
  floatingCartBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: "600",
  },
});
