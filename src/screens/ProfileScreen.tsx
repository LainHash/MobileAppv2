import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { PersonalInfoCard } from "@/features/auth";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.ordersButton}
        onPress={() => navigation.navigate("Orders")}
        activeOpacity={0.8}
      >
        <View style={styles.ordersIconWrap}>
          <Text style={styles.ordersIcon}>📦</Text>
        </View>
        <View style={styles.ordersInfo}>
          <Text style={styles.ordersTitle}>Đơn hàng của tôi</Text>
          <Text style={styles.ordersSubtitle}>
            Theo dõi trạng thái và lịch sử đặt món
          </Text>
        </View>
        <Text style={styles.ordersChevron}>›</Text>
      </TouchableOpacity>

      <PersonalInfoCard
        onLoginPress={() => navigation.navigate("Login")}
        onLogoutSuccess={() => navigation.navigate("Home")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  ordersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  ordersIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  ordersIcon: {
    fontSize: 20,
  },
  ordersInfo: {
    flex: 1,
  },
  ordersTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  ordersSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  ordersChevron: {
    fontSize: 24,
    color: "#94A3B8",
    fontWeight: "300",
    marginLeft: 8,
  },
});
