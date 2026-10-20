import React from "react";
import { StyleSheet, View, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "@/navigation/types";
import { AuthStepIndicator, CompleteProfileForm } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Spacing } from "@/theme";

type CompleteProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CompleteProfile"
>;

type CompleteProfileScreenRouteProp = RouteProp<
  RootStackParamList,
  "CompleteProfile"
>;

export default function CompleteProfileScreen() {
  const navigation = useNavigation<CompleteProfileScreenNavigationProp>();
  const route = useRoute<CompleteProfileScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const initialEmail = route.params?.email;

  const handleCompleteSuccess = () => {
    Alert.alert(
      "Đăng ký thành công 🎉",
      "Hồ sơ hội viên Haute De Hallen đã được thiết lập thành công. Kính mời quý khách đăng nhập để nhận các đặc quyền ẩm thực!",
      [
        {
          text: "Đăng nhập ngay",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="HOÀN TẤT HỒ SƠ"
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
          <AuthStepIndicator currentStep={3} />
          <CompleteProfileForm
            initialEmail={initialEmail}
            onSuccess={handleCompleteSuccess}
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
    maxWidth: 460,
    alignSelf: "center",
  },
});
