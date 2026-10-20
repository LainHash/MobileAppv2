import React from "react";
import { StyleSheet, View, ScrollView, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { AuthStepIndicator, RegisterForm } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius } from "@/theme";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleRegisterSuccess = (email: string) => {
    navigation.navigate("VerifyEmail", { email });
  };

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="ĐĂNG KÝ HỘI VIÊN"
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
        <View style={styles.formWrapper}>
          {/* Brand Emblem & Welcome Header */}
          <View style={styles.emblemHeader}>
            <View style={styles.emblemCircle}>
              <View style={styles.emblemInnerRing} />
              <Ionicons name="sparkles" size={24} color={Colors.secondaryGold} />
            </View>

            <View style={styles.clubBadge}>
              <Text style={styles.clubBadgeText}>Haute Member Club</Text>
            </View>

            <Text style={styles.welcomeTitle}>Gia nhập Hội Viên Tinh Hoa</Text>
            <Text style={styles.welcomeSubtitle}>
              Mở khóa các đặc quyền ẩm thực Á Đông thượng hạng
            </Text>
          </View>

          {/* Step Indicator */}
          <AuthStepIndicator currentStep={1} />

          {/* Form */}
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onLoginPress={handleLoginPress}
          />
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
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
  formWrapper: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  emblemHeader: {
    alignItems: "center",
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  emblemCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(196, 154, 69, 0.4)",
    marginBottom: Spacing.sm,
  },
  emblemInnerRing: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(126, 37, 22, 0.15)",
  },
  clubBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: 6,
  },
  clubBadgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSecondaryFixed,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  welcomeTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 3,
  },
  welcomeSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
});
