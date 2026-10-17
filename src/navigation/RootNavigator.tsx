import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import HomeScreen from "@/screens/HomeScreen";
import MenuScreen from "@/screens/MenuScreen";
import ProductDetailScreen from "@/screens/ProductDetailScreen";
import CartScreen from "@/screens/CartScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Trang chủ" }}
      />
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: "Thực đơn" }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: "Chi tiết sản phẩm" }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: "Giỏ hàng" }}
      />
    </Stack.Navigator>
  );
}
