import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface RoleNoticeBannerProps {
  roleName: string;
}

export default function RoleNoticeBanner({ roleName }: RoleNoticeBannerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bannerContainer,
        {
          paddingTop: insets.top > 0 ? insets.top + 4 : 8,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.bannerText}>
          Bạn đang đăng nhập với tư cách{" "}
          <Text style={styles.roleHighlight}>{roleName}</Text> một số chức năng
          sẽ bị hạn chế
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: "#DC2626", // Đỏ cảnh báo nổi bật
    paddingBottom: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
    borderBottomWidth: 1,
    borderBottomColor: "#B91C1C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    textAlign: "center",
    flexShrink: 1,
  },
  roleHighlight: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
