import {
  FlatList,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Product } from "../types/Product";
import { ProductCard } from "./ProductCard";
import { ProductApiProps } from "../api/productApi";

export interface ProductListProps {
  products: Product[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onProductPress?: (product: Product) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  apiProps?: ProductApiProps;
  isLoading?: boolean;
}

export function ProductList({
  products,
  refreshing = false,
  onRefresh,
  onProductPress,
  style,
  contentContainerStyle,
  isLoading = false,
}: ProductListProps) {
  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={onProductPress} />
        )}
        style={styles.list}
        contentContainerStyle={[styles.listContent, contentContainerStyle]}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.emptySubtitle}>Đang tải sản phẩm...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
              <Text style={styles.emptySubtitle}>
                Không tìm thấy sản phẩm phù hợp với bộ lọc đã chọn.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
  },
  list: {
    width: "100%",
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
});
