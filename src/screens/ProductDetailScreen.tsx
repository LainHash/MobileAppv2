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
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useProductDetail } from "@/features/catalog/products/hooks/useProductDetail";
import { getSelectedBranchId } from "@/features/territory/branches";
import { useCart, addCartItem, updateCartItemQuantity } from "@/features/commerce/carts";
import { useWishlist } from "@/features/commerce/wishlists";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { getImageUrl, formatCurrency } from "@/common/helpers";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetail"
>;
type ProductDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ProductDetail"
>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const {
    productId,
    product: initialProduct,
    branchId: initialBranchId,
  } = route.params;

  const [branchId, setBranchId] = useState<string | null>(
    initialBranchId ?? null,
  );
  const [isStorageLoaded, setIsStorageLoaded] = useState(
    Boolean(initialBranchId),
  );

  useEffect(() => {
    let isMounted = true;
    if (!initialBranchId) {
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
  }, [initialBranchId]);

  const { product, isLoading, error, refresh } = useProductDetail(
    productId,
    initialProduct,
    branchId,
    { enabled: isStorageLoaded },
  );

  // Cart integration
  const { cart, refresh: refreshCart } = useCart(branchId, { enabled: isStorageLoaded });
  const cartCount = useMemo(() => {
    return cart?.cartItems?.reduce((acc, it) => acc + it.quantity, 0) ?? 0;
  }, [cart?.cartItems]);

  // Wishlist integration
  const { isInWishlist, toggleItem: toggleWishlist } = useWishlist(branchId, {
    enabled: isStorageLoaded,
  });
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Collect all unique images into a gallery list
  const allImages = useMemo(() => {
    if (!product) return [];
    const list: { id: string; url: string; altText?: string }[] = [];
    const seen = new Set<string>();

    const addImage = (rawUrl?: string, alt?: string, id?: string) => {
      if (!rawUrl || seen.has(rawUrl)) return;
      seen.add(rawUrl);
      const cleanUrl = getImageUrl(rawUrl);
      if (cleanUrl) {
        list.push({ id: id || cleanUrl, url: cleanUrl, altText: alt });
      }
    };

    if (product.primaryImage?.image?.url) {
      addImage(
        product.primaryImage.image.url,
        product.primaryImage.image.altText,
        product.primaryImage.id,
      );
    }
    product.images?.forEach((img) => {
      if (img.image?.url) {
        addImage(img.image.url, img.image.altText, img.id);
      }
    });

    return list;
  }, [product]);

  const activeImageUrl = allImages[selectedImageIndex]?.url;

  const isOutOfStock =
    product?.stockStatus?.toLowerCase().includes("out") ||
    product?.stockStatus?.toLowerCase().includes("hết");

  const formattedPrice = formatCurrency(product?.unitPrice, product?.currency);
  const totalPrice = formatCurrency(
    (product?.unitPrice || 0) * quantity,
    product?.currency,
  );

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;
    try {
      setIsAddingToCart(true);
      await addCartItem({ productId: product.id }, { branchId });
      if (quantity > 1) {
        await updateCartItemQuantity(
          { productId: product.id, quantity },
          { branchId },
        );
      }
      await refreshCart();
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to add to cart", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Luxury Haute Top Bar */}
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="CHI TIẾT MÓN ẨM THỰC"
        showBack={true}
        cartCount={cartCount}
        onCartPress={() => navigation.navigate("Cart", { branchId })}
      />

      {/* Main Content Area */}
      {isLoading && !product ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang chuẩn bị thông tin món ăn...</Text>
        </View>
      ) : error && !product ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={44} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Không thể tải sản phẩm</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refresh()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : !product ? (
        <View style={styles.centerContainer}>
          <Ionicons name="restaurant-outline" size={48} color={Colors.outline} />
          <Text style={styles.errorTitle}>Không tìm thấy món ăn</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>Quay lại thực đơn</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContainer}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 95 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO DISH IMAGE WITH FLOATING WISHLIST BUTTON */}
            <View style={styles.heroImageWrap}>
              {Boolean(activeImageUrl && !imageError) ? (
                <Image
                  source={{ uri: activeImageUrl }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={300}
                  onError={() => setImageError(true)}
                  accessibilityLabel={
                    allImages[selectedImageIndex]?.altText || product.name
                  }
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="restaurant-outline" size={56} color={Colors.outline} />
                  <Text style={styles.placeholderText}>Món ăn Haute De Hallen</Text>
                </View>
              )}

              {/* Floating Quick Wishlist Button on Hero Image */}
              <TouchableOpacity
                style={styles.floatingWishlistBtn}
                onPress={() => toggleWishlist(product)}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={20}
                  color={isWishlisted ? Colors.primary : Colors.onSurface}
                />
              </TouchableOpacity>

              {/* Category Pill Tag */}
              {Boolean(product.categoryName) && (
                <View style={styles.categoryBadge}>
                  <Ionicons name="sparkles" size={11} color={Colors.secondary} />
                  <Text style={styles.categoryBadgeText} numberOfLines={1}>
                    {product.categoryName}
                  </Text>
                </View>
              )}
            </View>

            {/* Image Gallery Thumbnails */}
            {allImages.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailScrollView}
                contentContainerStyle={styles.thumbnailContainer}
              >
                {allImages.map((img, index) => {
                  const isSelected = index === selectedImageIndex;
                  return (
                    <TouchableOpacity
                      key={img.id || index}
                      style={[
                        styles.thumbnailWrapper,
                        isSelected && styles.thumbnailWrapperSelected,
                      ]}
                      onPress={() => {
                        setSelectedImageIndex(index);
                        setImageError(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: img.url }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                        transition={200}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* PRODUCT HEADER & PRICING CARD */}
            <View style={styles.dishHeaderCard}>
              <View style={styles.statusRow}>
                {Boolean(product.stockStatus) && (
                  <View
                    style={[
                      styles.stockBadge,
                      isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn,
                    ]}
                  >
                    <Ionicons
                      name={isOutOfStock ? "close-circle-outline" : "checkmark-circle-outline"}
                      size={12}
                      color={isOutOfStock ? "#DC2626" : "#16A34A"}
                    />
                    <Text
                      style={[
                        styles.stockBadgeText,
                        isOutOfStock ? styles.stockBadgeTextOut : styles.stockBadgeTextIn,
                      ]}
                    >
                      {product.stockStatus}
                    </Text>
                  </View>
                )}

                {Boolean(product.inventoryType) && (
                  <View style={styles.inventoryBadge}>
                    <Text style={styles.inventoryBadgeText}>
                      {product.inventoryType}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.dishTitle}>{product.name}</Text>

              <View style={styles.priceRow}>
                {formattedPrice ? (
                  <View style={styles.priceWrap}>
                    <Text style={styles.priceText}>{formattedPrice}</Text>
                    {Boolean(product.unitSymbol) && (
                      <Text style={styles.unitText}> / {product.unitSymbol}</Text>
                    )}
                  </View>
                ) : Boolean(product.unitSymbol) ? (
                  <Text style={styles.unitOnlyText}>
                    Đơn vị: {product.unitSymbol}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* DESCRIPTION SECTION */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.accentBar} />
                <Text style={styles.sectionTitle}>GIỚI THIỆU MÓN ĂN</Text>
              </View>
              <Text style={styles.descriptionText}>
                {product.description
                  ? product.description
                  : "Món ăn được tuyển chọn từ nguồn nguyên liệu thượng hạng, kết hợp tinh tế giữa di sản ẩm thực Á Đông truyền thống và kỹ nghệ chế biến hiện đại của bếp trưởng Haute De Hallen."}
              </Text>
            </View>

            {/* SPECIFICATIONS & DETAILS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.accentBar} />
                <Text style={styles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>
              </View>
              <View style={styles.specTable}>
                <View style={styles.specRow}>
                  <View style={styles.specLabelWrap}>
                    <Ionicons name="barcode-outline" size={15} color={Colors.outline} />
                    <Text style={styles.specLabel}>Mã món ăn</Text>
                  </View>
                  <Text style={styles.specValue}>{product.id.slice(0, 12)}</Text>
                </View>

                {Boolean(product.unitSymbol) && (
                  <View style={styles.specRow}>
                    <View style={styles.specLabelWrap}>
                      <Ionicons name="cube-outline" size={15} color={Colors.outline} />
                      <Text style={styles.specLabel}>Đơn vị phục vụ</Text>
                    </View>
                    <Text style={styles.specValue}>{product.unitSymbol}</Text>
                  </View>
                )}

                {Boolean(product.inventoryType) && (
                  <View style={styles.specRow}>
                    <View style={styles.specLabelWrap}>
                      <Ionicons name="layers-outline" size={15} color={Colors.outline} />
                      <Text style={styles.specLabel}>Loại tồn kho</Text>
                    </View>
                    <Text style={styles.specValue}>{product.inventoryType}</Text>
                  </View>
                )}

                {Boolean(product.stockStatus) && (
                  <View style={styles.specRow}>
                    <View style={styles.specLabelWrap}>
                      <Ionicons name="shield-checkmark-outline" size={15} color={Colors.outline} />
                      <Text style={styles.specLabel}>Tình trạng</Text>
                    </View>
                    <Text style={styles.specValue}>{product.stockStatus}</Text>
                  </View>
                )}

                {Boolean(product.currency) && (
                  <View style={styles.specRow}>
                    <View style={styles.specLabelWrap}>
                      <Ionicons name="cash-outline" size={15} color={Colors.outline} />
                      <Text style={styles.specLabel}>Đơn vị tiền tệ</Text>
                    </View>
                    <Text style={styles.specValue}>{product.currency}</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* LUXURY STICKY BOTTOM BAR: WISHLIST + STEPPER + ADD TO CART */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {/* Quick Wishlist Action Button */}
            <TouchableOpacity
              style={[
                styles.bottomWishlistBtn,
                isWishlisted && styles.bottomWishlistBtnActive,
              ]}
              onPress={() => toggleWishlist(product)}
              activeOpacity={0.85}
              accessibilityLabel={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={22}
                color={isWishlisted ? Colors.primary : Colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            {/* Stepper Controls */}
            <View style={styles.stepperWrap}>
              <TouchableOpacity
                style={[
                  styles.stepperBtn,
                  quantity <= 1 && styles.stepperBtnDisabled,
                ]}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={quantity <= 1 ? Colors.outline : Colors.onSurface}
                />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.stepperBtn,
                  isOutOfStock && styles.stepperBtnDisabled,
                ]}
                onPress={() => setQuantity((q) => q + 1)}
                disabled={isOutOfStock}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={isOutOfStock ? Colors.outline : Colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            {/* Add to Cart CTA */}
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                (isOutOfStock || isAddingToCart) && styles.addToCartBtnDisabled,
                isAdded && styles.addToCartBtnSuccess,
              ]}
              onPress={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              activeOpacity={0.85}
            >
              {isAddingToCart ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : isAdded ? (
                <View style={styles.btnRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.onPrimary} />
                  <Text style={styles.addToCartBtnText}>Đã thêm vào giỏ</Text>
                </View>
              ) : isOutOfStock ? (
                <Text style={styles.addToCartBtnText}>Tạm hết món</Text>
              ) : (
                <View style={styles.btnRow}>
                  <Ionicons name="bag-handle-outline" size={18} color={Colors.onPrimary} />
                  <Text style={styles.addToCartBtnText}>
                    {totalPrice ? `Thêm • ${totalPrice}` : "Thêm vào giỏ"}
                  </Text>
                </View>
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
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(186, 26, 26, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginBottom: 6,
  },
  errorSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
  },
  retryBtnText: {
    color: Colors.onPrimary,
    ...Typography.labelMd,
    fontWeight: "700",
  },

  // Hero Image
  heroImageWrap: {
    width: "100%",
    height: 310,
    backgroundColor: Colors.surfaceContainerLow,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
  },
  placeholderText: {
    marginTop: 8,
    ...Typography.bodySm,
    color: Colors.outline,
  },
  floatingWishlistBtn: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  categoryBadge: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(43, 30, 28, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(217, 169, 78, 0.4)",
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    ...Typography.labelSm,
    fontWeight: "600",
  },

  // Thumbnails
  thumbnailScrollView: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: Colors.borderSoft,
  },
  thumbnailContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    overflow: "hidden",
    backgroundColor: Colors.surfaceContainerLow,
  },
  thumbnailWrapperSelected: {
    borderColor: Colors.secondary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  // Dish Header Card
  dishHeaderCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.xs,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  stockBadgeIn: {
    backgroundColor: "#DCFCE7",
  },
  stockBadgeOut: {
    backgroundColor: "#FEE2E2",
  },
  stockBadgeText: {
    ...Typography.labelSm,
    fontWeight: "600",
  },
  stockBadgeTextIn: {
    color: "#16A34A",
  },
  stockBadgeTextOut: {
    color: "#DC2626",
  },
  inventoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  inventoryBadgeText: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
  },
  dishTitle: {
    ...Typography.headlineMd,
    fontSize: 22,
    color: Colors.onSurface,
    marginTop: 6,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceText: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  unitText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  unitOnlyText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  accentBar: {
    width: 3,
    height: 14,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  sectionTitle: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: "700",
    letterSpacing: 1,
  },
  descriptionText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
  },

  // Specifications
  specTable: {
    gap: 8,
    marginTop: 4,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  specLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  specLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  specValue: {
    ...Typography.labelMd,
    fontWeight: "600",
    color: Colors.onSurface,
    maxWidth: "50%",
    textAlign: "right",
  },

  // Bottom Sticky Bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.borderSoft,
    gap: 12,
    ...Shadows.floating,
  },
  bottomWishlistBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomWishlistBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(158, 60, 43, 0.08)",
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperValue: {
    ...Typography.labelLg,
    fontWeight: "700",
    color: Colors.onSurface,
    minWidth: 26,
    textAlign: "center",
  },
  addToCartBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    ...Shadows.subtle,
  },
  addToCartBtnDisabled: {
    backgroundColor: Colors.outline,
    opacity: 0.6,
  },
  addToCartBtnSuccess: {
    backgroundColor: "#16A34A",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addToCartBtnText: {
    color: Colors.onPrimary,
    ...Typography.labelLg,
    fontWeight: "700",
  },
});
