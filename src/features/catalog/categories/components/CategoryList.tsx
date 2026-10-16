// src/features/catalog/product-categories/components/CategoryList.tsx
import { FlatList, Text, View, StyleSheet } from "react-native";
import { ProductCategory } from "../types/Category";

interface Props {
  categories: ProductCategory[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function CategoryList({ categories, refreshing, onRefresh }: Props) {
  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          {item.description && (
            <Text style={styles.desc}>{item.description}</Text>
          )}
        </View>
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  item: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
  name: { fontSize: 16, fontWeight: "500" },
  desc: { fontSize: 12, color: "#666", marginTop: 4 },
});
