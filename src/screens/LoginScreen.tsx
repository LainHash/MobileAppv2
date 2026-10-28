import React from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { LoginForm, User } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type LoginScreenRouteProp = RouteProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute<LoginScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const handleSuccess = (user?: User, hasPersonalProfile?: boolean) => {
    const hasProfile =
      hasPersonalProfile !== undefined
        ? hasPersonalProfile
        : Boolean(user?.personalProfile);

    if (!hasProfile) {
      // Server check: Chưa có thông tin cá nhân -> Chuyển hướng tới nhập TTCN
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "CompleteProfile",
            params: { email: user?.email || route.params?.identifier },
          },
        ],
      });
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Profile");
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="HỘI VIÊN & ĐẶC QUYỀN"
        showBack={navigation.canGoBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 90 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Brand Emblem & Welcome Header */}
          <View style={styles.emblemHeader}>
            <View style={styles.emblemCircle}>
              <View style={styles.emblemInnerRing} />
              <Ionicons name="sparkles" size={26} color={Colors.secondaryGold} />
            </View>

            <View style={styles.clubBadge}>
              <Text style={styles.clubBadgeText}>Haute Member Club</Text>
            </View>

            <Text style={styles.welcomeTitle}>
              Chào mừng quý khách đến với Haute De Hallen
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Trải nghiệm ẩm thực trọn vẹn & tinh hoa vị giác đương đại
            </Text>
          </View>

          {/* Platinum Privilege VIP Card Preview */}
          <View style={styles.vipCard}>
            <View style={styles.vipHeaderRow}>
              <View style={styles.vipTitleRow}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={Colors.secondaryFixedDim}
                />
                <Text style={styles.vipSubtitle}>Platinum Privilege</Text>
              </View>
              <View style={styles.vipTierBadge}>
                <Text style={styles.vipTierText}>VIP TIER</Text>
              </View>
            </View>

            <Text style={styles.vipMainTitle}>Hội Viên Tinh Hoa</Text>
            <Text style={styles.vipDesc}>
              Đặc quyền ẩm thực thượng hạng chuẩn phong vị Á Đông
            </Text>

            {/* Perks Grid */}
            <View style={styles.perksRow}>
              <View style={styles.perkBox}>
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color={Colors.secondaryFixedDim}
                />
                <Text style={styles.perkTitle}>Tích lũy 5%</Text>
                <Text style={styles.perkDesc}>Điểm thưởng</Text>
              </View>

              <View style={styles.perkBox}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={Colors.secondaryFixedDim}
                />
                <Text style={styles.perkTitle}>Ưu tiên VIP</Text>
                <Text style={styles.perkDesc}>Phòng riêng</Text>
              </View>

              <View style={styles.perkBox}>
                <Ionicons
                  name="gift-outline"
                  size={16}
                  color={Colors.secondaryFixedDim}
                />
                <Text style={styles.perkTitle}>Quà tặng</Text>
                <Text style={styles.perkDesc}>Dịp sinh nhật</Text>
              </View>
            </View>
          </View>

          {/* Login Form */}
          <LoginForm
            key={route.params?.identifier || "login-default"}
            defaultIdentifier={route.params?.identifier || ""}
            onSuccess={handleSuccess}
            onForgotPasswordPress={() => navigation.navigate("ForgotPassword")}
            onRegisterPress={() => navigation.navigate("Register")}
          />
        </View>
      </ScrollView>

      {/* Floating Bottom Nav Bar */}
      <HauteBottomBar activeTab="Account" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },

  // Emblem Header
  emblemHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  emblemCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(253, 206, 115, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(196, 154, 69, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    position: "relative",
  },
  emblemInnerRing: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(123, 89, 2, 0.15)",
  },
  clubBadge: {
    backgroundColor: "rgba(253, 206, 115, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  clubBadgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSecondaryContainer,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  welcomeTitle: {
    ...Typography.headlineMd,
    fontSize: 20,
    color: Colors.primary,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: Spacing.sm,
  },
  welcomeSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 300,
  },

  // VIP Platinum Card
  vipCard: {
    backgroundColor: "#2B2320",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(238, 192, 103, 0.3)",
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  vipHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  vipTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vipSubtitle: {
    ...Typography.labelSm,
    color: Colors.secondaryFixedDim,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  vipTierBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  vipTierText: {
    color: Colors.surfaceContainerLowest,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  vipMainTitle: {
    ...Typography.headlineSm,
    fontSize: 17,
    color: Colors.secondaryFixed,
    marginTop: 4,
  },
  vipDesc: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.tertiaryFixedDim,
    opacity: 0.9,
    marginBottom: Spacing.md,
  },
  perksRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  perkBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  perkTitle: {
    ...Typography.labelSm,
    fontSize: 11,
    color: "#FFFFFF",
    marginTop: 2,
  },
  perkDesc: {
    ...Typography.bodySm,
    fontSize: 9,
    color: Colors.tertiaryFixedDim,
  },
});
