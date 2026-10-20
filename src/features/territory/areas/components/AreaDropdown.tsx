import React, { useMemo } from "react";
import { StyleSheet, StyleProp, ViewStyle, View, Text } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Area } from "../types/Area";

export const ALL_AREA_ID = "__ALL__";

interface Props {
  areas: Area[];
  value?: string | null;
  onSelect?: (id: string | null) => void;
  placeholder?: string;
  allowAllOption?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ALL_AREA_OPTION: Area = {
  id: ALL_AREA_ID,
  name: "Tất cả khu vực",
};

export function AreaDropdown({
  areas,
  value,
  onSelect,
  placeholder = "Chọn khu vực",
  allowAllOption = true,
  disabled = false,
  style,
}: Props) {
  const data = useMemo(
    () => (allowAllOption ? [ALL_AREA_OPTION, ...areas] : areas),
    [areas, allowAllOption],
  );

  const activeValue =
    value === null && allowAllOption ? ALL_AREA_ID : value || undefined;

  return (
    <View style={disabled && styles.disabledContainer}>
      <Dropdown
        data={data}
        labelField="name"
        valueField="id"
        value={activeValue}
        placeholder={disabled ? "Vui lòng chọn chi nhánh trước" : placeholder}
        disable={disabled}
        search={!disabled && data.length > 5}
        searchPlaceholder="Tìm khu vực..."
        onChange={(item: Area) => {
          const finalId = item.id === ALL_AREA_ID ? null : item.id;
          onSelect?.(finalId);
        }}
        renderLeftIcon={() => (
          <Text style={styles.leftIcon}>{disabled ? "🔒" : "🧭"}</Text>
        )}
        style={[styles.dropdown, disabled && styles.dropdownDisabled, style]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        itemTextStyle={styles.itemTextStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  disabledContainer: {
    opacity: 0.6,
  },
  dropdown: {
    height: 48,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  leftIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#94A3B8",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 8,
  },
  itemTextStyle: {
    fontSize: 14,
    color: "#1E293B",
  },
});
