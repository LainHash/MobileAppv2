import { useState } from "react";
import {
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Product } from "../types/Product";
import { getProductImageUrl, formatCurrency } from "@/common/helpers";

export interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({ product, onPress, style }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = getProductImageUrl(product);
  const showImage = Boolean(imageUrl && !imageError);
  const formattedPrice = formatCurrency(product.unitPrice, product.currency);
  const isOutOfStock =
    product.stockStatus?.toLowerCase().includes("out") ||
    product.stockStatus?.toLowerCase().includes("hết");

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={() => onPress?.(product)}
      disabled={!onPress}
    >
      {/* Cột ảnh chính sản phẩm */}
      <View style={styles.imageWrapper}>
        {showImage ? (
          <Image
            source={{ uri: imageUrl! }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
            accessibilityLabel={
              product.primaryImage?.image?.altText || product.name
            }
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📦</Text>
            <Text style={styles.placeholderText}>Chưa có ảnh</Text>
          </View>
        )}
      </View>

      {/* Cột thông tin chi tiết */}
      <View style={styles.infoWrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {Boolean(product.categoryName) && (
            <Text style={styles.metaText}>{product.categoryName}</Text>
          )}
          {Boolean(product.brandName) && (
            <Text style={styles.metaText}>{product.brandName}</Text>
          )}
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
          </View>

          {Boolean(product.stockStatus) && (
            <View
              style={[
                styles.stockBadge,
                isOutOfStock ? styles.stockOutOfStock : styles.stockInStock,
              ]}
            >
              <Text
                style={[
                  styles.stockText,
                  isOutOfStock
                    ? styles.stockTextOutOfStock
                    : styles.stockTextInStock,
                ]}
              >
                {product.stockStatus}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: "center",
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  },
  placeholderIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  placeholderText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  infoWrapper: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 90,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 4,
  },
  priceContainer: {
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563EB",
  },
  unit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748B",
  },
  unitOnly: {
    fontSize: 12,
    color: "#64748B",
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  stockInStock: {
    backgroundColor: "#DCFCE7",
  },
  stockOutOfStock: {
    backgroundColor: "#FEE2E2",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600",
  },
  stockTextInStock: {
    color: "#16A34A",
  },
  stockTextOutOfStock: {
    color: "#DC2626",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
});
