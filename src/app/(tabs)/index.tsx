// src/app/(tabs)/index.tsx
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useCategories } from "@/features/catalog/categories";
import { useBrands } from "@/features/catalog/brands";
import HomeDropdownSelection from "@/common/components/HomeDropdownSelection";

export default function HomeScreen() {
  const {
    categories,
    isLoading: isLoadingCategory,
    error: errorCategory,
    refresh: refreshCategory,
  } = useCategories();
  const {
    brands,
    isLoading: isLoadingBrand,
    error: errorBrand,
    refresh: refreshBrand,
  } = useBrands();

  const isLoading = isLoadingCategory || isLoadingBrand;
  const error = errorCategory ?? errorBrand;
  const handleRefresh = async () => {
    await Promise.all([refreshCategory(), refreshBrand()]);
  };

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
      <HomeDropdownSelection categories={categories} brands={brands} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 14 },
  dropdownSelection: {},
});
