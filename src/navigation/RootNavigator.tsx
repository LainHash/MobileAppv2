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
import ReservationScreen from "@/screens/ReservationScreen";
import ReservationSuccessScreen from "@/screens/ReservationSuccessScreen";
import MyReservationsScreen from "@/screens/MyReservationsScreen";
import ReservationDetailScreen from "@/screens/ReservationDetailScreen";
import { useAuthContext } from "@/features/auth";
import RoleNoticeBanner from "@/common/components/RoleNoticeBanner";
import { Colors } from "@/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isAuthenticated } = useAuthContext();

  const isNonCustomer =
    isAuthenticated &&
    Boolean(user?.roleName) &&
    user?.roleName?.trim().toLowerCase() !== "customer";

  return (
    <View style={styles.container}>
      <StatusBar style={isNonCustomer ? "light" : "dark"} />
      {isNonCustomer && <RoleNoticeBanner roleName={user!.roleName} />}
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            color: Colors.primary,
            fontWeight: "700",
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: "Chi tiết sản phẩm" }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Wishlist"
          component={WishlistScreen}
          options={{ title: "Yêu thích" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
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
        <Stack.Screen
          name="Reservation"
          component={ReservationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReservationSuccess"
          component={ReservationSuccessScreen}
          options={{
            title: "Đặt bàn thành công",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="MyReservations"
          component={MyReservationsScreen}
          options={{ title: "Lịch sử đặt bàn" }}
        />
        <Stack.Screen
          name="ReservationDetail"
          component={ReservationDetailScreen}
          options={{ title: "Chi tiết đặt bàn" }}
        />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
