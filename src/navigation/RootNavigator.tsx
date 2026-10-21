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
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Wishlist"
          component={WishlistScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfileScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderSuccess"
          component={OrderSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reservation"
          component={ReservationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReservationSuccess"
          component={ReservationSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyReservations"
          component={MyReservationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReservationDetail"
          component={ReservationDetailScreen}
          options={{ headerShown: false }}
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
