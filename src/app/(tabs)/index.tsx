// src/app/(tabs)/index.tsx
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import {
  useCategories,
  CategoryList,
  CategoryDropdown,
} from "@/features/catalog/categories";

export default function HomeScreen() {
  const { categories, isLoading, error, refresh } = useCategories();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CategoryDropdown categories={categories} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 14 },
});
