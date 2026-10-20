import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Shadows } from "@/theme";
import { RootStackParamList } from "@/navigation/types";
import { useAuthContext } from "@/features/auth";

export type HauteTabKey = "Home" | "Menu" | "Reservation" | "Cart" | "Account";

interface HauteBottomBarProps {
  activeTab: HauteTabKey;
  cartCount?: number;
}

export function HauteBottomBar({
  activeTab,
  cartCount = 0,
}: HauteBottomBarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthContext();

  // On Android (Pixel 6 gesture navigation bar), ensure sufficient breathing room
  // even if insets.bottom is unmeasured or small
  const bottomInset = Platform.select({
    android: Math.max(insets.bottom, 12),
    ios: Math.max(insets.bottom, 8),
    default: Math.max(insets.bottom, 8),
  }) || 8;

  const handleTabPress = (tab: HauteTabKey) => {
    if (tab === activeTab) return;

    switch (tab) {
      case "Home":
        navigation.navigate("Home");
        break;
      case "Menu":
        navigation.navigate("Menu");
        break;
      case "Reservation":
        navigation.navigate("Reservation");
        break;
      case "Cart":
        navigation.navigate("Cart");
        break;
      case "Account":
        if (isAuthenticated) {
          navigation.navigate("Profile");
        } else {
          navigation.navigate("Login");
        }
        break;
    }
  };

  const tabs: {
    key: HauteTabKey;
    label: string;
    renderIcon: (isActive: boolean) => React.ReactNode;
    badgeCount?: number;
  }[] = [
    {
      key: "Home",
      label: "Trang chủ",
      renderIcon: (isActive) => (
        <Ionicons
          name={isActive ? "home" : "home-outline"}
          size={22}
          color={isActive ? Colors.primaryContainer : Colors.onSurfaceVariant}
        />
      ),
    },
    {
      key: "Menu",
      label: "Thực đơn",
      renderIcon: (isActive) => (
        <Ionicons
          name={isActive ? "restaurant" : "restaurant-outline"}
          size={22}
          color={isActive ? Colors.primaryContainer : Colors.onSurfaceVariant}
        />
      ),
    },
    {
      key: "Reservation",
      label: "Đặt bàn",
      renderIcon: (isActive) => (
        <MaterialCommunityIcons
          name={isActive ? "table-chair" : "table-chair"}
          size={22}
          color={isActive ? Colors.primaryContainer : Colors.onSurfaceVariant}
        />
      ),
    },
    {
      key: "Cart",
      label: "Giỏ hàng",
      badgeCount: cartCount,
      renderIcon: (isActive) => (
        <Ionicons
          name={isActive ? "bag-handle" : "bag-handle-outline"}
          size={22}
          color={isActive ? Colors.primaryContainer : Colors.onSurfaceVariant}
        />
      ),
    },
    {
      key: "Account",
      label: "Tài khoản",
      renderIcon: (isActive) => (
        <Ionicons
          name={isActive ? "person" : "person-outline"}
          size={22}
          color={isActive ? Colors.primaryContainer : Colors.onSurfaceVariant}
        />
      ),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomInset,
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {tab.renderIcon(isActive)}
                {Boolean(tab.badgeCount && tab.badgeCount > 0) && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {tab.badgeCount! > 99 ? "99+" : tab.badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(252, 249, 243, 0.96)",
    borderTopWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.floating,
    zIndex: 50,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  iconContainer: {
    position: "relative",
    width: 28,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primaryContainer,
    fontWeight: "700",
  },
  tabLabelInactive: {
    color: Colors.onSurfaceVariant,
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: Colors.onPrimary,
    fontSize: 9,
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -2,
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.primaryContainer,
  },
});

export default HauteBottomBar;
