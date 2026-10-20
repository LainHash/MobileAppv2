import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import { Cart } from "../types/Cart";
import { getProductImageUrl, formatCurrency } from "@/common/helpers";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  cart?: Cart;
  refreshing?: boolean;
  onRefresh?: () => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
}

export function CartItemList({
  cart,
  onUpdateQuantity,
  onRemoveItem,
}: Props) {
  const items = cart?.cartItems ?? [];

  return (
    <View style={styles.listContainer}>
      {items.map((item) => {
        const imageUrl = getProductImageUrl(item);
        const itemPrice = item.product?.unitPrice;
        const totalItemPrice =
          itemPrice !== undefined && itemPrice !== null
            ? itemPrice * item.quantity
            : undefined;
        const productId =
          item.product?.id || item.productId || (item as any).productId || item.id;

        return (
          <View key={item.id || item.product?.id || productId} style={styles.card}>
            {/* Image Thumbnail */}
            <View style={styles.thumbnailWrapper}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="restaurant-outline" size={24} color={Colors.outline} />
                </View>
              )}
            </View>

            {/* Info details */}
            <View style={styles.info}>
              <View style={styles.headerRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.product?.name}
                </Text>
                {onRemoveItem && (
                  <TouchableOpacity
                    onPress={() => onRemoveItem(productId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={18} color={Colors.outline} />
                  </TouchableOpacity>
                )}
              </View>

              {Boolean(item.product?.categoryName) && (
                <Text style={styles.categoryText}>
                  {item.product?.categoryName}
                </Text>
              )}

              <View style={styles.bottomRow}>
                <View>
                  {totalItemPrice !== undefined ? (
                    <Text style={styles.price}>
                      {formatCurrency(totalItemPrice, item.product?.currency)}
                    </Text>
                  ) : null}
                  {itemPrice !== undefined && item.quantity > 1 ? (
                    <Text style={styles.unitPrice}>
                      {formatCurrency(itemPrice, item.product?.currency)} / phần
                    </Text>
                  ) : null}
                </View>

                {onUpdateQuantity ? (
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => {
                        if (item.quantity > 1) {
                          onUpdateQuantity(productId, item.quantity - 1);
                        } else if (onRemoveItem) {
                          onRemoveItem(productId);
                        }
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="remove" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.quantityButton, styles.quantityPlusButton]}
                      onPress={() =>
                        onUpdateQuantity(productId, item.quantity + 1)
                      }
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="add" size={14} color={Colors.onPrimary} />
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
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 24,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    flex: 1,
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
    ...Typography.headlineSm,
    fontSize: 14,
    color: Colors.onSurface,
    flex: 1,
    marginRight: 6,
    lineHeight: 19,
  },
  removeButton: {
    padding: 2,
  },
  categoryText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: Spacing.sm,
    paddingTop: 4,
  },
  price: {
    ...Typography.labelLg,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primaryContainer,
  },
  unitPrice: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.outline,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  quantityButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityPlusButton: {
    backgroundColor: Colors.primaryContainer,
  },
  quantityText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.onSurface,
    minWidth: 26,
    textAlign: "center",
  },
  quantityOnlyText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryContainer,
  },
});

export default CartItemList;
