import React from "react";
import { StyleSheet, Text, View, ViewStyle, TextStyle } from "react-native";
import {
  OrderStatus,
  OrderStatusString,
  getOrderStatusMeta,
} from "../types/order";

export interface OrderStatusBadgeProps {
  status: OrderStatus | OrderStatusString | number | undefined;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

export function OrderStatusBadge({
  status,
  size = "medium",
  style,
}: OrderStatusBadgeProps) {
  const meta = getOrderStatusMeta(status);

  const sizeContainerStyle: ViewStyle =
    size === "small"
      ? styles.smallContainer
      : size === "large"
        ? styles.largeContainer
        : styles.mediumContainer;

  const sizeTextStyle: TextStyle =
    size === "small"
      ? styles.smallText
      : size === "large"
        ? styles.largeText
        : styles.mediumText;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bgColor, borderColor: meta.color },
        sizeContainerStyle,
        style,
      ]}
    >
      <Text style={styles.icon}>{meta.icon}</Text>
      <Text style={[styles.text, { color: meta.color }, sizeTextStyle]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
    fontSize: 12,
  },
  text: {
    fontWeight: "700",
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  smallText: {
    fontSize: 11,
  },
  mediumContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mediumText: {
    fontSize: 12,
  },
  largeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  largeText: {
    fontSize: 14,
  },
});
