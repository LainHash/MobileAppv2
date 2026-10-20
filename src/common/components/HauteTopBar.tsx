import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Shadows } from "@/theme";
import { RootStackParamList } from "@/navigation/types";

interface HauteTopBarProps {
  title?: string;
  subtitle?: string;
  branchName?: string;
  onBranchPress?: () => void;
  showBack?: boolean;
  cartCount?: number;
  hasNotification?: boolean;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
}

export function HauteTopBar({
  title = "Haute De Hallen",
  subtitle,
  branchName,
  onBranchPress,
  showBack = false,
  cartCount = 0,
  hasNotification = false,
  onNotificationPress,
  onCartPress,
}: HauteTopBarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCartPress = () => {
    if (onCartPress) {
      onCartPress();
    } else {
      navigation.navigate("Cart");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.branchPill}
            onPress={onBranchPress}
            activeOpacity={onBranchPress ? 0.7 : 1}
          >
            <MaterialIcons name="restaurant-menu" size={18} color={Colors.primary} />
            {Boolean(branchName) && (
              <View style={styles.branchTextWrap}>
                <Ionicons name="location-sharp" size={12} color={Colors.secondaryGold} />
                <Text style={styles.branchText} numberOfLines={1}>
                  {branchName}
                </Text>
                {Boolean(onBranchPress) && (
                  <Ionicons name="chevron-down" size={12} color={Colors.onSurfaceVariant} />
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerGroup}>
        <Text style={styles.brandTitle} numberOfLines={1}>
          {title}
        </Text>
        {Boolean(subtitle) && (
          <Text style={styles.brandSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightGroup}>
        {onNotificationPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="notifications-outline" size={21} color={Colors.onSurfaceVariant} />
            {hasNotification && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleCartPress}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="bag-handle-outline" size={22} color={Colors.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? "99+" : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
    zIndex: 40,
  },
  leftGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  branchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
  },
  branchTextWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    maxWidth: 120,
  },
  branchText: {
    ...Typography.labelSm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  centerGroup: {
    flex: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    ...Typography.headlineSm,
    color: Colors.primary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    ...Typography.labelSm,
    color: Colors.secondaryGold,
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: -2,
  },
  rightGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerLow,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: Colors.onPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
});

export default HauteTopBar;
