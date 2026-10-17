import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { AuthStepIndicator, VerifyEmailForm } from "@/features/auth";

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

  const initialEmail = route.params?.email;

  const handleVerifySuccess = (verifiedEmail: string) => {
    navigation.navigate("CompleteProfile", { email: verifiedEmail });
  };

  const handleRestartRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
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
