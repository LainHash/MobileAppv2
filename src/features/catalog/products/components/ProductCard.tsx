import { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Product } from "../types/Product";
import { getProductImageUrl, formatCurrency } from "@/common/helpers";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  style,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = getProductImageUrl(product);
  const showImage = Boolean(imageUrl && !imageError);
  const formattedPrice = formatCurrency(product.unitPrice, product.currency);
  const isOutOfStock =
    product.stockStatus?.toLowerCase().includes("out") ||
    product.stockStatus?.toLowerCase().includes("hết");

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={onPress ? 0.8 : 1}
      onPress={() => onPress?.(product)}
      disabled={!onPress}
    >
      {/* Product Image */}
      <View style={styles.imageWrapper}>
        {showImage ? (
          <Image
            source={{ uri: imageUrl! }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
            accessibilityLabel={
              product.primaryImage?.image?.altText || product.name
            }
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="restaurant-outline" size={28} color={Colors.outline} />
            <Text style={styles.placeholderText}>Món ngon</Text>
          </View>
        )}

        {/* Quick Wishlist Toggle Button */}
        {onToggleWishlist && (
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
            accessibilityLabel={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={16}
              color={isWishlisted ? Colors.primary : Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}

        {/* Badge */}
        {Boolean(product.categoryName) && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {product.categoryName}
            </Text>
          </View>
        )}

        {/* Recommended Badge */}
        {Boolean(product.isRecommended) && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="star" size={10} color="#D97706" />
            <Text style={styles.recommendedBadgeText}>Nổi bật</Text>
          </View>
        )}
      </View>

      {/* Info Column */}
      <View style={styles.infoWrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
        </View>

        {Boolean(product.description) && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            {formattedPrice ? (
              <Text style={styles.price}>
                {formattedPrice}
                {Boolean(product.unitSymbol) && (
                  <Text style={styles.unit}> / {product.unitSymbol}</Text>
                )}
              </Text>
            ) : Boolean(product.unitSymbol) ? (
              <Text style={styles.unitOnly}>Đơn vị: {product.unitSymbol}</Text>
            ) : null}

            {Boolean(product.stockStatus) && (
              <Text
                style={[
                  styles.stockText,
                  isOutOfStock
                    ? styles.stockTextOutOfStock
                    : styles.stockTextInStock,
                ]}
              >
                {isOutOfStock ? "Tạm hết món" : "Đang phục vụ"}
              </Text>
            )}
          </View>

          {onAddToCart && !isOutOfStock && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onAddToCart(product)}
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={18} color={Colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.subtle,
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    backgroundColor: Colors.surfaceContainerLow,
  },
  placeholderText: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.outline,
    marginTop: 2,
  },
  categoryBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(126, 37, 22, 0.88)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.full,
    maxWidth: 90,
  },
  categoryBadgeText: {
    color: Colors.onPrimary,
    fontSize: 9,
    fontWeight: "600",
  },
  recommendedBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(254, 243, 199, 0.95)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "#FDE68A",
  },
  recommendedBadgeText: {
    color: "#B45309",
    fontSize: 9,
    fontWeight: "700",
  },
  wishlistBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(252, 249, 243, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
    zIndex: 10,
  },
  infoWrapper: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 100,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  name: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
    lineHeight: 20,
    flex: 1,
  },
  description: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  priceContainer: {
    flex: 1,
    marginRight: 8,
  },
  price: {
    ...Typography.labelLg,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  unit: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: "400",
    color: Colors.outline,
  },
  unitOnly: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
  },
  stockText: {
    ...Typography.labelSm,
    fontSize: 10,
    marginTop: 1,
  },
  stockTextInStock: {
    color: Colors.success,
  },
  stockTextOutOfStock: {
    color: Colors.error,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
});

export default ProductCard;
