import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import { Wishlist, WishlistItem } from "../types/Wishlist";
import { Product } from "@/features/catalog/products";
import { getProductImageUrl, formatCurrency } from "@/common/helpers";

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
            activeOpacity={onProductPress && product ? 0.8 : 1}
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
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <Text style={styles.thumbnailPlaceholderText}>📦</Text>
              </View>
            )}

            <View style={styles.info}>
              <View style={styles.headerRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {product?.name || "Sản phẩm"}
                </Text>
                {onRemoveItem && (
                  <TouchableOpacity
                    onPress={() => onRemoveItem(productId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeButton}
                    accessibilityLabel="Xóa khỏi yêu thích"
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {Boolean(product?.unitSymbol) && (
                <Text style={styles.unitText}>
                  Đơn vị: {product.unitSymbol}
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
                    <Text style={styles.addToCartButtonText}>
                      {isOutOfStock ? "Hết hàng" : "+ Thêm vào giỏ"}
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
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailPlaceholderText: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 2,
  },
  removeButtonText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "bold",
  },
  unitText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeInStock: {
    backgroundColor: "#DCFCE7",
  },
  badgeOutOfStock: {
    backgroundColor: "#FEE2E2",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeTextInStock: {
    color: "#16A34A",
  },
  badgeTextOutOfStock: {
    color: "#DC2626",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  addToCartButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addToCartButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  addToCartButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
