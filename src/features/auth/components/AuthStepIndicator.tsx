import React from "react";
import { StyleSheet, Text, View } from "react-native";

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
                    <Text style={styles.checkmarkText}>✓</Text>
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
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    minWidth: 80,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  circleActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  circleCompleted: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  stepNumberActive: {
    color: "#FFFFFF",
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  label: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  labelActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  labelCompleted: {
    color: "#10B981",
    fontWeight: "600",
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 4,
    marginBottom: 20,
  },
  connectorActive: {
    backgroundColor: "#10B981",
  },
});
