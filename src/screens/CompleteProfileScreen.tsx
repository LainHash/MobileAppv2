import React, { useEffect } from "react";
import { StyleSheet, View, Alert, ScrollView, BackHandler, TouchableOpacity, Text } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { AuthStepIndicator, CompleteProfileForm, useAuthContext } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Spacing, Typography } from "@/theme";

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
  const { user, isAuthenticated, logout, refreshMe } = useAuthContext();

  const initialEmail = route.params?.email || user?.email;

  const handleExit = () => {
    Alert.alert(
      "Chưa hoàn tất thông tin cá nhân",
      "Quý khách cần hoàn tất thông tin cá nhân để kích hoạt quyền lợi hội viên và sử dụng dịch vụ. Nếu thoát bây giờ, tài khoản sẽ được đăng xuất và bắt đầu lại từ màn hình đăng nhập.",
      [
        { text: "Ở lại điền tiếp", style: "cancel" },
        {
          text: "Đăng xuất & Thoát",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ],
      { cancelable: true },
    );
  };

  useEffect(() => {
    const onBackPress = () => {
      handleExit();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [logout]);

  const handleCompleteSuccess = async () => {
    if (isAuthenticated) {
      try {
        await refreshMe();
      } catch (err) {
        console.warn("Could not refresh user profile", err);
      }
      Alert.alert(
        "Hoàn tất hồ sơ 🎉",
        "Hồ sơ hội viên Haute De Hallen đã được thiết lập thành công. Kính mời quý khách trải nghiệm ẩm thực thượng hạng!",
        [
          {
            text: "Bắt đầu trải nghiệm",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            },
          },
        ],
        { cancelable: false },
      );
    } else {
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
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="HOÀN TẤT HỒ SƠ"
        showBack={true}
        onBackPress={handleExit}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing.xl },
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

          {/* Explicit Exit / Logout Button */}
          <TouchableOpacity
            style={styles.exitButton}
            onPress={handleExit}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={16} color={Colors.error} />
            <Text style={styles.exitButtonText}>Thoát và đăng xuất tài khoản</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  exitButtonText: {
    ...Typography.labelMd,
    color: Colors.error,
    fontWeight: "600",
  },
});
