import { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useProductDetail } from "@/features/catalog/products/hooks/useProductDetail";
import { getSelectedBranchId } from "@/features/territory/branches";
import { addCartItem, updateCartItemQuantity } from "@/features/commerce/carts";
import { getImageUrl, formatCurrency } from "@/common/helpers";

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


  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Cart", { branchId })}
          style={{ marginRight: 8, padding: 6 }}
          accessibilityLabel="Giỏ hàng"
        >
          <Text style={{ fontSize: 20 }}>🛒</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, branchId]);

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

  if (isLoading && !product) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải thông tin sản phẩm...</Text>
      </View>
    );
  }

  if (error && !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Không thể tải sản phẩm</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refresh()}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Image */}
        <View style={styles.heroImageContainer}>
          {Boolean(activeImageUrl && !imageError) ? (
            <Image
              source={{ uri: activeImageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
              accessibilityLabel={
                allImages[selectedImageIndex]?.altText || product.name
              }
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderIcon}>📦</Text>
              <Text style={styles.placeholderText}>Chưa có hình ảnh</Text>
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
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Product Details Section */}
        <View style={styles.detailsCard}>
          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {Boolean(product.stockStatus) && (
              <View
                style={[
                  styles.badge,
                  isOutOfStock ? styles.badgeOutOfStock : styles.badgeInStock,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isOutOfStock
                      ? styles.badgeTextOutOfStock
                      : styles.badgeTextInStock,
                  ]}
                >
                  {product.stockStatus}
                </Text>
              </View>
            )}

            {Boolean(product.inventoryType) && (
              <View style={[styles.badge, styles.badgeNeutral]}>
                <Text style={styles.badgeTextNeutral}>
                  {product.inventoryType}
                </Text>
              </View>
            )}
          </View>

          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price & Unit */}
          <View style={styles.priceRow}>
            {formattedPrice ? (
              <Text style={styles.priceText}>
                {formattedPrice}
                {Boolean(product.unitSymbol) && (
                  <Text style={styles.unitText}> / {product.unitSymbol}</Text>
                )}
              </Text>
            ) : Boolean(product.unitSymbol) ? (
              <Text style={styles.unitOnlyText}>
                Đơn vị: {product.unitSymbol}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.descriptionText}>
            {product.description
              ? product.description
              : "Chưa có mô tả chi tiết cho sản phẩm này."}
          </Text>
        </View>

        {/* Product Specifications / Attributes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          <View style={styles.specTable}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Mã sản phẩm</Text>
              <Text style={styles.specValue}>{product.id}</Text>
            </View>
            {Boolean(product.unitSymbol) && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Đơn vị tính</Text>
                <Text style={styles.specValue}>{product.unitSymbol}</Text>
              </View>
            )}
            {Boolean(product.inventoryType) && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Loại tồn kho</Text>
                <Text style={styles.specValue}>{product.inventoryType}</Text>
              </View>
            )}
            {Boolean(product.stockStatus) && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Trạng thái kho</Text>
                <Text style={styles.specValue}>{product.stockStatus}</Text>
              </View>
            )}
            {Boolean(product.currency) && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Đơn vị tiền tệ</Text>
                <Text style={styles.specValue}>{product.currency}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar: Quantity & Add to Cart */}
      <View style={styles.bottomBar}>
        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              quantity <= 1 && styles.quantityButtonDisabled,
            ]}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || isOutOfStock}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              isOutOfStock && styles.quantityButtonDisabled,
            ]}
            onPress={() => setQuantity((q) => q + 1)}
            disabled={isOutOfStock}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            (isOutOfStock || isAddingToCart) && styles.actionButtonDisabled,
            isAdded && styles.actionButtonSuccess,
          ]}
          onPress={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {isAdded
              ? "✓ Đã thêm vào giỏ"
              : isAddingToCart
                ? "Đang thêm..."
                : isOutOfStock
                  ? "Hết hàng"
                  : totalPrice
                    ? `Thêm vào giỏ • ${totalPrice}`
                    : "Thêm vào giỏ"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  errorSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  heroImageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  placeholderIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
  thumbnailScrollView: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  thumbnailWrapperSelected: {
    borderColor: "#2563EB",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeInStock: {
    backgroundColor: "#DCFCE7",
  },
  badgeOutOfStock: {
    backgroundColor: "#FEE2E2",
  },
  badgeNeutral: {
    backgroundColor: "#F1F5F9",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextInStock: {
    color: "#16A34A",
  },
  badgeTextOutOfStock: {
    color: "#DC2626",
  },
  badgeTextNeutral: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "500",
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 28,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563EB",
  },
  unitText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#64748B",
  },
  unitOnlyText: {
    fontSize: 14,
    color: "#64748B",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  specTable: {
    gap: 10,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
  },
  specLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  specValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "60%",
    textAlign: "right",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  quantityButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    minWidth: 24,
    textAlign: "center",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  actionButtonSuccess: {
    backgroundColor: "#16A34A",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
