import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

interface PartySizeStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
}

export function PartySizeStepper({
  value,
  onChange,
  min = 1,
  max = 100,
}: PartySizeStepperProps) {
  const quickSizes = [2, 4, 6, 8, 10];

  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepperButton, value <= min && styles.buttonDisabled]}
          onPress={handleDecrease}
          disabled={value <= min}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonIcon}>−</Text>
        </TouchableOpacity>

        <View style={styles.valueDisplay}>
          <Text style={styles.valueText}>{value}</Text>
          <Text style={styles.valueUnit}>khách</Text>
        </View>

        <TouchableOpacity
          style={[styles.stepperButton, value >= max && styles.buttonDisabled]}
          onPress={handleIncrease}
          disabled={value >= max}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickSelectRow}>
        {quickSizes.map((size) => {
          const isSelected = value === size;
          return (
            <TouchableOpacity
              key={`quick-${size}`}
              style={[styles.quickChip, isSelected && styles.quickChipSelected]}
              onPress={() => onChange(size)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.quickChipText,
                  isSelected && styles.quickChipTextSelected,
                ]}
              >
                {size} người
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#db2020ff",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  buttonIcon: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    minWidth: 120,
    gap: 4,
  },
  valueText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  valueUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  quickSelectRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickChipSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#db2020ff",
  },
  quickChipText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  quickChipTextSelected: {
    color: "#db2020ff",
    fontWeight: "700",
  },
});
