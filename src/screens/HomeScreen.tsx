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

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { brands, categories, branches, products, isLoading, error, refresh } =
    useHome();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang chủ</Text>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <HomeDropdownSelection
          categories={categories}
          brands={brands}
          branches={branches}
        />
      )}
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ProductList
          products={products}
          refreshing={isLoading}
          onRefresh={refresh}
        />
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Menu")}
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
