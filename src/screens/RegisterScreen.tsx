import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { AuthStepIndicator, RegisterForm } from "@/features/auth";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const handleRegisterSuccess = (email: string) => {
    navigation.navigate("VerifyEmail", { email });
  };

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formWrapper}>
        <AuthStepIndicator currentStep={1} />
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onLoginPress={handleLoginPress}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  formWrapper: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
});
