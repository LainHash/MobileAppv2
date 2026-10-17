import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import { Cart, CartItem } from "../types/Cart";

interface Props {
  cart?: Cart;
  refreshing?: boolean;
  onRefresh?: () => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
}

function formatPrice(price?: number, currency?: string) {
  if (price === undefined || price === null) return null;
  const formatted = price.toLocaleString("vi-VN");
  return currency ? `${formatted} ${currency}` : `${formatted} ₫`;
}

function getProductImageUrl(item: CartItem): string | null {
  const rawUrl =
    item.product?.primaryImage?.image?.url ||
    item.product?.images?.[0]?.image?.url;
  if (!rawUrl) return null;
  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("data:")
  ) {
    return rawUrl;
  }
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${cleanBase}${cleanPath}`;
}

export function CartItemList({
  cart,
  refreshing,
  onRefresh,
  onUpdateQuantity,
  onRemoveItem,
}: Props) {
  const items = cart?.cartItems ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id || item.product?.id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => {
        const imageUrl = getProductImageUrl(item);
        const itemPrice = item.product?.unitPrice;
        const totalItemPrice =
          itemPrice !== undefined && itemPrice !== null
            ? itemPrice * item.quantity
            : undefined;

        return (
          <View style={styles.card}>
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
                  {item.product?.name}
                </Text>
                {onRemoveItem && (
                  <TouchableOpacity
                    onPress={() => onRemoveItem(item.product?.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {Boolean(item.product?.unitSymbol) && (
                <Text style={styles.unitText}>
                  Đơn vị: {item.product.unitSymbol}
                </Text>
              )}

              <View style={styles.bottomRow}>
                <View>
                  {totalItemPrice !== undefined ? (
                    <Text style={styles.price}>
                      {formatPrice(totalItemPrice, item.product?.currency)}
                    </Text>
                  ) : null}
                  {itemPrice !== undefined && item.quantity > 1 ? (
                    <Text style={styles.unitPrice}>
                      {formatPrice(itemPrice, item.product?.currency)} / sp
                    </Text>
                  ) : null}
                </View>

                {onUpdateQuantity ? (
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        if (item.quantity > 1) {
                          onUpdateQuantity(item.product?.id, item.quantity - 1);
                        } else if (onRemoveItem) {
                          onRemoveItem(item.product?.id);
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        onUpdateQuantity(item.product?.id, item.quantity + 1)
                      }
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.quantityOnlyText}>
                    x{item.quantity}
                  </Text>
                )}
              </View>
            </View>
          </View>
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
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailPlaceholderText: {
    fontSize: 24,
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
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  unitPrice: {
    fontSize: 11,
    color: "#94A3B8",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
  },
  quantityButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quantityButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  quantityText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    minWidth: 20,
    textAlign: "center",
  },
  quantityOnlyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
});
