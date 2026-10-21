import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface GoogleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  title?: string;
  style?: ViewStyle;
}

export function GoogleSignInButton({
  onPress,
  isLoading = false,
  disabled = false,
  title = "Tiếp tục với Google",
  style,
}: GoogleSignInButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.googleIconCircle}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
          </View>
          <Text style={styles.buttonText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    ...Shadows.subtle,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  googleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  buttonText: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.onSurface,
  },
});
