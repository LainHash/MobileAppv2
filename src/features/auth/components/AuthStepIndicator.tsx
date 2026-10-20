import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface AuthStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { step: 1, label: "Đăng ký" },
  { step: 2, label: "Xác thực OTP" },
  { step: 3, label: "Hồ sơ cá nhân" },
];

export function AuthStepIndicator({ currentStep }: AuthStepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((item, index) => {
          const isCompleted = item.step < currentStep;
          const isActive = item.step === currentStep;

          return (
            <React.Fragment key={item.step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Colors.onSecondaryFixed}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        isActive && styles.stepNumberActive,
                      ]}
                    >
                      {item.step}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    isActive && styles.labelActive,
                    isCompleted && styles.labelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>

              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    item.step < currentStep && styles.connectorActive,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    minWidth: 84,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    ...Shadows.subtle,
  },
  circleActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.secondaryGold,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  circleCompleted: {
    backgroundColor: Colors.secondaryFixed,
    borderColor: Colors.secondaryGold,
  },
  stepNumber: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.outline,
  },
  stepNumberActive: {
    color: Colors.onPrimary,
  },
  label: {
    ...Typography.labelSm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: "500",
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  labelCompleted: {
    color: Colors.secondaryGold,
    fontWeight: "600",
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borderSoft,
    marginHorizontal: Spacing.xs,
    marginBottom: 22,
  },
  connectorActive: {
    backgroundColor: Colors.secondaryGold,
  },
});
