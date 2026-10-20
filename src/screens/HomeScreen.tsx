import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useHome } from "@/common/hooks/useHome";
import {
  getSelectedBranchId,
  saveSelectedBranchId,
  BranchDropdown,
} from "@/features/territory/branches";
import { useCart } from "@/features/commerce/carts";
import { useWishlist } from "@/features/commerce/wishlists";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { ProductCard } from "@/features/catalog/products/components/ProductCard";
import { formatCurrency, getProductImageUrl } from "@/common/helpers";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";
import { Product } from "@/features/catalog/products";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Load saved branch id from local storage
  useEffect(() => {
    getSelectedBranchId().then((storedId) => {
      if (storedId) {
        setSelectedBranchId(storedId);
      }
      setIsStorageLoaded(true);
    });
  }, []);

  // Fetch real data from homeApi
  const {
    categories,
    branches,
    products,
    isLoading: isHomeLoading,
    error: homeError,
    refresh: refreshHome,
  } = useHome(selectedBranchId, { enabled: isStorageLoaded });

  // Fetch cart data from cartApi
  const { cart, addItem } = useCart(selectedBranchId, { enabled: isStorageLoaded });
  const cartCount = useMemo(() => {
    return cart?.cartItems?.reduce((acc, it) => acc + it.quantity, 0) ?? 0;
  }, [cart?.cartItems]);

  // Wishlist quick action
  const { isInWishlist, toggleItem: toggleWishlist } = useWishlist(selectedBranchId, {
    enabled: isStorageLoaded,
  });

  const currentBranch = useMemo(() => {
    if (!branches || branches.length === 0) return null;
    if (selectedBranchId) {
      const found = branches.find((b) => b.id === selectedBranchId);
      if (found) return found;
    }
    return branches[0];
  }, [branches, selectedBranchId]);

  const handleSelectBranch = (branchId: string | null) => {
    setSelectedBranchId(branchId);
    saveSelectedBranchId(branchId);
    setShowBranchModal(false);
  };

  const branchDisplayName = currentBranch
    ? currentBranch.branchCode || currentBranch.city || "Chi nhánh"
    : "Haute De Hallen";

  const handleAddToCart = async (product: Product) => {
    await addItem(product.id, selectedBranchId);
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top App Bar with real branch name */}
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="ẨM THỰC Á ĐÔNG ĐƯƠNG ĐẠI"
        branchName={branchDisplayName}
        onBranchPress={() => setShowBranchModal((prev) => !prev)}
        cartCount={cartCount}
        onCartPress={() =>
          navigation.navigate("Cart", { branchId: selectedBranchId })
        }
      />

      {/* Branch selector overlay */}
      {showBranchModal && (
        <View style={styles.branchSelectOverlay}>
          <Text style={styles.branchSelectTitle}>Chọn chi nhánh phục vụ:</Text>
          <BranchDropdown
            branches={branches}
            value={selectedBranchId}
            onSelect={handleSelectBranch}
            placeholder="Chọn chi nhánh"
            hideAllOption
          />
        </View>
      )}

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BRAND BANNER */}
        <View style={styles.heroCard}>
          <View style={styles.heroGradientOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={12} color={Colors.onSecondaryFixed} />
              <Text style={styles.heroBadgeText}>Trải Nghiệm Thượng Hạng</Text>
            </View>

            <Text style={styles.heroTitle}>Haute De Hallen</Text>

            <Text style={styles.heroDescription}>
              Tinh hoa ẩm thực Á Đông đương đại – Nơi di sản giao hòa cùng kỹ nghệ ẩm thực tinh tuyển.
            </Text>

            <View style={styles.heroButtonGroup}>
              <TouchableOpacity
                style={styles.heroPrimaryBtn}
                onPress={() =>
                  navigation.navigate("Reservation", {
                    branchId: selectedBranchId,
                  })
                }
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="table-chair"
                  size={18}
                  color={Colors.onPrimary}
                />
                <Text style={styles.heroPrimaryBtnText}>Đặt bàn ngay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroSecondaryBtn}
                onPress={() =>
                  navigation.navigate("Menu", {
                    branchId: selectedBranchId,
                  })
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.heroSecondaryBtnText}>Xem thực đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* QUICK ACCESS ACTIONS */}
        <View style={styles.quickAccessSection}>
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() =>
              navigation.navigate("Menu", {
                branchId: selectedBranchId,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.quickAccessCircle}>
              <MaterialIcons name="takeout-dining" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickAccessLabel}>Thực đơn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() =>
              navigation.navigate("Reservation", {
                branchId: selectedBranchId,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.quickAccessCircle}>
              <MaterialCommunityIcons
                name="party-popper"
                size={24}
                color={Colors.secondary}
              />
            </View>
            <Text style={styles.quickAccessLabel}>Đặt bàn tiệc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => navigation.navigate("Orders", { branchId: selectedBranchId })}
            activeOpacity={0.7}
          >
            <View style={styles.quickAccessCircle}>
              <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.quickAccessLabel}>Đơn hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => navigation.navigate("Contact")}
            activeOpacity={0.7}
          >
            <View style={styles.quickAccessCircle}>
              <Ionicons name="call-outline" size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.quickAccessLabel}>Liên hệ</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION: CATEGORIES REEL FROM API */}
        {categories && categories.length > 0 && (
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionOverline}>DANH MỤC MÓN ĂN</Text>
                <Text style={styles.sectionHeading}>Khám phá theo danh mục</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Menu", { branchId: selectedBranchId })
                }
                style={styles.viewAllRow}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Tất cả</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollList}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCard}
                  onPress={() =>
                    navigation.navigate("Menu", {
                      categoryId: cat.id,
                      branchId: selectedBranchId,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryIconWrap}>
                    <Ionicons
                      name="restaurant"
                      size={20}
                      color={Colors.primaryContainer}
                    />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* SECTION: FEATURED PRODUCTS FROM API (TINH TÚY BẾP TRƯỞNG) */}
        {products && products.length > 0 && (
          <View style={styles.signatureSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionOverline}>TINH TÚY BẾP TRƯỞNG</Text>
                <Text style={styles.sectionHeading}>Món ăn khuyên dùng</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Menu", { branchId: selectedBranchId })
                }
                style={styles.viewAllRow}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.signatureScrollList}
            >
              {products.slice(0, 6).map((product) => {
                const imgUrl = getProductImageUrl(product);
                const formattedPrice = formatCurrency(
                  product.unitPrice,
                  product.currency,
                );

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.signatureCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("ProductDetail", {
                        productId: product.id,
                        product,
                        branchId: selectedBranchId,
                      })
                    }
                  >
                    <View style={styles.signatureImageWrap}>
                      {imgUrl ? (
                        <Image
                          source={{ uri: imgUrl }}
                          style={styles.signatureImage}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View style={styles.placeholderImg}>
                          <Ionicons
                            name="restaurant-outline"
                            size={32}
                            color={Colors.outline}
                          />
                        </View>
                      )}

                      {Boolean(product.categoryName) && (
                        <View style={styles.signatureTagBadge}>
                          <Text style={styles.signatureTagText} numberOfLines={1}>
                            {product.categoryName}
                          </Text>
                        </View>
                      )}

                      {/* Floating Quick Wishlist Button */}
                      <TouchableOpacity
                        style={styles.signatureWishlistBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.8}
                        accessibilityLabel={
                          isInWishlist(product.id)
                            ? "Bỏ yêu thích"
                            : "Thêm vào yêu thích"
                        }
                      >
                        <Ionicons
                          name={isInWishlist(product.id) ? "heart" : "heart-outline"}
                          size={16}
                          color={
                            isInWishlist(product.id)
                              ? Colors.primary
                              : Colors.onSurfaceVariant
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.signatureInfo}>
                      <Text style={styles.signatureTitle} numberOfLines={1}>
                        {product.name}
                      </Text>

                      {Boolean(product.description) && (
                        <Text style={styles.signatureSubtitle} numberOfLines={2}>
                          {product.description}
                        </Text>
                      )}

                      <View style={styles.signatureBottomRow}>
                        <View>
                          <Text style={styles.signaturePrice}>
                            {formattedPrice || "Đang cập nhật"}
                          </Text>
                          {Boolean(product.unitSymbol) && (
                            <Text style={styles.signaturePortion}>
                              /{product.unitSymbol}
                            </Text>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.signatureAddBtn}
                          onPress={() => handleAddToCart(product)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add" size={18} color={Colors.onPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* SECTION: FULL LIVE PRODUCTS LIST FROM API */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionOverline}>DANH SÁCH MÓN ĂN</Text>
            <Text style={styles.sectionHeading}>
              Món ăn tại {branchDisplayName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Menu", { branchId: selectedBranchId })
            }
            style={styles.viewAllRow}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Thực đơn đầy đủ</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {isHomeLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primaryContainer} />
            <Text style={styles.loadingText}>Đang tải món ăn từ nhà hàng...</Text>
          </View>
        ) : homeError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{homeError}</Text>
            <TouchableOpacity onPress={() => refreshHome()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : products && products.length > 0 ? (
          <View style={styles.liveProductsList}>
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={handleAddToCart}
                isWishlisted={isInWishlist(prod.id)}
                onToggleWishlist={toggleWishlist}
                onPress={(p) =>
                  navigation.navigate("ProductDetail", {
                    productId: p.id,
                    product: p,
                    branchId: selectedBranchId,
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Chưa có món ăn nào tại chi nhánh này.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Nav Bar */}
      <HauteBottomBar activeTab="Home" cartCount={cartCount} />
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
    paddingTop: Spacing.md,
  },
  branchSelectOverlay: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  branchSelectTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.primary,
    minHeight: 220,
    justifyContent: "flex-end",
    ...Shadows.elevated,
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(126, 37, 22, 0.85)",
  },
  heroContent: {
    position: "relative",
    zIndex: 10,
    padding: Spacing.lg,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.xs,
  },
  heroBadgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSecondaryFixed,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroTitle: {
    ...Typography.headlineLg,
    fontSize: 26,
    color: "#FFFFFF",
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  heroDescription: {
    ...Typography.bodySm,
    color: Colors.onPrimaryContainer,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  heroButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  heroPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    ...Shadows.card,
  },
  heroPrimaryBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  heroSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(252, 249, 243, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  heroSecondaryBtnText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Quick Access
  quickAccessSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  quickAccessItem: {
    flex: 1,
    alignItems: "center",
  },
  quickAccessCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  quickAccessLabel: {
    ...Typography.labelSm,
    fontSize: 11,
    color: Colors.onSurface,
    textAlign: "center",
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionOverline: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.secondaryGold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionHeading: {
    ...Typography.headlineMd,
    fontSize: 18,
    color: Colors.onSurface,
    marginTop: 2,
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  viewAllText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "600",
  },

  // Categories
  categoriesSection: {
    marginTop: Spacing.sm,
  },
  categoryScrollList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(158, 60, 43, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },

  // Featured Signature Reel
  signatureSection: {
    marginTop: Spacing.xs,
  },
  signatureScrollList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  signatureCard: {
    width: 230,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: "hidden",
    ...Shadows.subtle,
  },
  signatureImageWrap: {
    width: "100%",
    height: 125,
    backgroundColor: Colors.surfaceContainerLow,
    position: "relative",
  },
  signatureImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  signatureTagBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    maxWidth: 150,
  },
  signatureTagText: {
    color: Colors.onPrimary,
    fontSize: 9,
    fontWeight: "600",
  },
  signatureWishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  signatureInfo: {
    padding: Spacing.md,
    justifyContent: "space-between",
    flex: 1,
  },
  signatureTitle: {
    ...Typography.headlineSm,
    fontSize: 14,
    color: Colors.onSurface,
  },
  signatureSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
    marginVertical: 4,
  },
  signatureBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  signaturePrice: {
    ...Typography.labelLg,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  signaturePortion: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.outline,
  },
  signatureAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },

  // Live products
  liveProductsList: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: 8,
  },
  loadingText: {
    ...Typography.bodySm,
    color: Colors.outline,
  },
  errorBox: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
    marginBottom: 6,
  },
  retryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: Colors.error,
    borderRadius: Radius.sm,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.bodySm,
    color: Colors.outline,
  },
});
