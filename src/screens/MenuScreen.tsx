import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useCategories } from "@/features/catalog/categories";
import { useBrands } from "@/features/catalog/brands";
import HomeDropdownSelection from "@/common/components/HomeDropdownSelection";

export default function MenuScreen() {
  const {
    categories,
    isLoading: isLoadingCategory,
    error: errorCategory,
  } = useCategories();
  const {
    brands,
    isLoading: isLoadingBrand,
    error: errorBrand,
  } = useBrands();

  const isLoading = isLoadingCategory || isLoadingBrand;
  const error = errorCategory ?? errorBrand;

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
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 14 },
});
