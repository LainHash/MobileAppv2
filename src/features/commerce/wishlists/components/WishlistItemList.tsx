import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Wishlist, WishlistItem } from "../types/Wishlist";
import { Product } from "@/features/catalog/products";
import { getProductImageUrl, formatCurrency } from "@/common/helpers";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

interface Props {
  wishlist?: Wishlist | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onRemoveItem?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  onProductPress?: (product: Product) => void;
}

export function WishlistItemList({
  wishlist,
  refreshing,
  onRefresh,
  onRemoveItem,
  onAddToCart,
  onProductPress,
}: Props) {
  const items: WishlistItem[] =
    wishlist?.wishlistItems || wishlist?.items || [];

  return (
    <FlatList
      data={items}
      keyExtractor={(item) =>
        item.id || item.product?.id || item.productId || String(Math.random())
      }
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const product = item.product;
        const imageUrl = product ? getProductImageUrl(product) : null;
        const itemPrice = product?.unitPrice;
        const productId =
          product?.id || item.productId || (item as any).productId || item.id;

        const isOutOfStock =
          product?.stockStatus?.toLowerCase().includes("out") ||
          product?.stockStatus?.toLowerCase().includes("hết");

        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={onProductPress && product ? 0.85 : 1}
            onPress={() => {
              if (onProductPress && product) {
                onProductPress(product);
              }
            }}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <Ionicons name="restaurant-outline" size={28} color={Colors.outline} />
              </View>
            )}

            <View style={styles.info}>
              <View style={styles.headerRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {product?.name || "Món ẩm thực"}
                </Text>
                {onRemoveItem && (
                  <TouchableOpacity
                    onPress={() => onRemoveItem(productId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeButton}
                    accessibilityLabel="Xóa khỏi yêu thích"
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.outline} />
                  </TouchableOpacity>
                )}
              </View>

              {Boolean(product?.unitSymbol) && (
                <Text style={styles.unitText}>
                  Khẩu phần: {product.unitSymbol}
                </Text>
              )}

              {Boolean(product?.stockStatus) && (
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

              <View style={styles.bottomRow}>
                <View>
                  {itemPrice !== undefined && itemPrice !== null ? (
                    <Text style={styles.price}>
                      {formatCurrency(itemPrice, product?.currency)}
                    </Text>
                  ) : null}
                </View>

                {onAddToCart && product && (
                  <TouchableOpacity
                    style={[
                      styles.addToCartButton,
                      isOutOfStock && styles.addToCartButtonDisabled,
                    ]}
                    onPress={() => onAddToCart(product)}
                    disabled={isOutOfStock}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="bag-handle-outline"
                      size={14}
                      color={isOutOfStock ? Colors.outline : Colors.onPrimary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.addToCartButtonText,
                        isOutOfStock && styles.addToCartButtonTextDisabled,
                      ]}
                    >
                      {isOutOfStock ? "Hết món" : "Thêm vào giỏ"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  thumbnail: {
    width: 82,
    height: 82,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
    flex: 1,
    marginRight: Spacing.xs,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  unitText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeInStock: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  badgeOutOfStock: {
    backgroundColor: "#FEE2E2",
  },
  badgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "600",
  },
  badgeTextInStock: {
    color: Colors.secondaryGold,
  },
  badgeTextOutOfStock: {
    color: Colors.error,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  price: {
    ...Typography.titleSm,
    color: Colors.primary,
    fontWeight: "800",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  addToCartButtonDisabled: {
    backgroundColor: Colors.surfaceContainer,
  },
  addToCartButtonText: {
    ...Typography.labelSm,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  addToCartButtonTextDisabled: {
    color: Colors.outline,
  },
});
