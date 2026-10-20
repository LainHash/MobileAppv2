import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "@/navigation/types";
import { AuthStepIndicator, VerifyEmailForm } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Spacing } from "@/theme";

type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "VerifyEmail"
>;

type VerifyEmailScreenRouteProp = RouteProp<
  RootStackParamList,
  "VerifyEmail"
>;

export default function VerifyEmailScreen() {
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const route = useRoute<VerifyEmailScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const initialEmail = route.params?.email;

  const handleVerifySuccess = (verifiedEmail: string) => {
    navigation.navigate("CompleteProfile", { email: verifiedEmail });
  };

  const handleRestartRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="XÁC THỰC BẢO MẬT"
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
          <AuthStepIndicator currentStep={2} />
          <VerifyEmailForm
            initialEmail={initialEmail}
            onSuccess={handleVerifySuccess}
            onRestartRegister={handleRestartRegister}
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
});
