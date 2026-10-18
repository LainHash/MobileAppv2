import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import HomeScreen from "@/screens/HomeScreen";
import MenuScreen from "@/screens/MenuScreen";
import ProductDetailScreen from "@/screens/ProductDetailScreen";
import CartScreen from "@/screens/CartScreen";
import WishlistScreen from "@/screens/WishlistScreen";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import VerifyEmailScreen from "@/screens/VerifyEmailScreen";
import CompleteProfileScreen from "@/screens/CompleteProfileScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import ContactScreen from "@/screens/ContactScreen";
import CheckoutScreen from "@/screens/CheckoutScreen";
import OrderSuccessScreen from "@/screens/OrderSuccessScreen";
import OrdersScreen from "@/screens/OrdersScreen";
import OrderDetailScreen from "@/screens/OrderDetailScreen";
import { useAuthContext } from "@/features/auth";
import RoleNoticeBanner from "@/common/components/RoleNoticeBanner";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isAuthenticated } = useAuthContext();

  const isNonCustomer =
    isAuthenticated &&
    Boolean(user?.roleName) &&
    user?.roleName?.trim().toLowerCase() !== "customer";

  return (
    <View style={styles.container}>
      <StatusBar style={isNonCustomer ? "light" : "auto"} />
      {isNonCustomer && <RoleNoticeBanner roleName={user!.roleName} />}
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
        <Stack.Screen
          name="Wishlist"
          component={WishlistScreen}
          options={{ title: "Yêu thích" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Đăng nhập" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Đăng ký tài khoản" }}
        />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          options={{ title: "Xác thực email" }}
        />
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfileScreen}
          options={{ title: "Hoàn tất thông tin" }}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Thông tin cá nhân" }}
        />
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{ title: "Liên hệ & Góp ý" }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ title: "Thanh toán đơn hàng" }}
        />
        <Stack.Screen
          name="OrderSuccess"
          component={OrderSuccessScreen}
          options={{
            title: "Đặt hàng thành công",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{ title: "Lịch sử đơn hàng" }}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ title: "Chi tiết đơn hàng" }}
        />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});


