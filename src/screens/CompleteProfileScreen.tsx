import React from "react";
import { StyleSheet, View, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { AuthStepIndicator, CompleteProfileForm } from "@/features/auth";

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

  const initialEmail = route.params?.email;

  const handleCompleteSuccess = () => {
    Alert.alert(
      "Đăng ký thành công 🎉",
      "Hồ sơ tài khoản của bạn đã được thiết lập thành công. Vui lòng đăng nhập để bắt đầu trải nghiệm dịch vụ!",
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
    <View style={styles.container}>
      <View style={styles.formWrapper}>
        <AuthStepIndicator currentStep={3} />
        <CompleteProfileForm
          initialEmail={initialEmail}
          onSuccess={handleCompleteSuccess}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  formWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
});
