import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import HomeDropdownSelection from "@/common/components/HomeDropdownSelection";
import { ProductList } from "@/features/catalog/products/components/ProductList";
import { useHome } from "@/common/hooks/useHome";
import {
  getSelectedBranchId,
  saveSelectedBranchId,
} from "@/features/territory/branches";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [dropdownResetKey, setDropdownResetKey] = useState(0);

  // Load saved branch id from local storage on mount
  useEffect(() => {
    getSelectedBranchId().then((storedId) => {
      if (storedId) {
        setSelectedBranchId(storedId);
      }
      setIsStorageLoaded(true);
    });
  }, []);

  const {
    brands,
    categories,
    branches,
    products,
    isLoading: isHomeLoading,
    error: homeError,
    refresh: refreshHome,
  } = useHome(selectedBranchId, { enabled: isStorageLoaded });

  const handleSelectBranch = (branchId: string | null) => {
    setSelectedBranchId(branchId);
    saveSelectedBranchId(branchId);
  };

  const handleSelectCategory = (categoryId: string | null) => {
    setDropdownResetKey((prev) => prev + 1);
    navigation.navigate("Menu", {
      categoryId,
      brandId: null,
      branchId: selectedBranchId,
    });
  };

  const handleSelectBrand = (brandId: string | null) => {
    setDropdownResetKey((prev) => prev + 1);
    navigation.navigate("Menu", {
      categoryId: null,
      brandId,
      branchId: selectedBranchId,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang chủ</Text>
      {isHomeLoading ? (
        <ActivityIndicator size="large" />
      ) : homeError ? (
        <Text style={styles.errorText}>{homeError}</Text>
      ) : (
        <HomeDropdownSelection
          key={`home-dropdown-${dropdownResetKey}`}
          categories={categories}
          brands={brands}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onSelectCategory={handleSelectCategory}
          onSelectBrand={handleSelectBrand}
          onSelectBranch={handleSelectBranch}
        />
      )}

      {isHomeLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          {Boolean(homeError) && (
            <Text style={styles.errorText}>{homeError}</Text>
          )}
          <ProductList
            products={products}
            isLoading={isHomeLoading}
            refreshing={isHomeLoading}
            onRefresh={refreshHome}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate("Menu", {
            branchId: selectedBranchId,
          })
        }
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Chuyển tới Menu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    fontSize: 14,
  },
});
