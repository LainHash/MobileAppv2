import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { OrderItemResponse, getPreparationStatusMeta } from "../types/order";
import { getImageUrl, formatCurrency } from "@/common/helpers";

export interface OrderItemCardProps {
  item: OrderItemResponse;
}

export function OrderItemCard({ item }: OrderItemCardProps) {
  const rawUrl =
    item.product?.primaryImage?.image?.url ||
    item.product?.images?.find((img) => img.isPrimary)?.image?.url ||
    item.product?.images?.[0]?.image?.url;
  const imageUrl = getImageUrl(rawUrl);

  const price = item.unitPrice ?? 0;
  const total = item.lineTotal ?? item.total ?? price * item.quantity;
  const prepMeta = getPreparationStatusMeta(item.preparationStatus);

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailText}>🍽️</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {item.productName || item.product?.name || "Món ăn"}
          </Text>
          {prepMeta && (
            <View style={[styles.prepBadge, { backgroundColor: prepMeta.bg }]}>
              <Text style={[styles.prepBadgeText, { color: prepMeta.color }]}>
                {prepMeta.label}
              </Text>
            </View>
          )}
        </View>

        {Boolean(item.note) && (
          <Text style={styles.note} numberOfLines={1}>
            Ghi chú: {item.note}
          </Text>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.quantityText}>x{item.quantity}</Text>
          <Text style={styles.totalPrice}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 18,
  },
  prepBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  prepBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  note: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  quantityText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007AFF",
  },
});
