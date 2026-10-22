import { Branch } from "../types/Branch";
import { Dropdown } from "react-native-element-dropdown";
import React, { useState, useMemo } from "react";
import { StyleSheet, StyleProp, ViewStyle, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Radius, Shadows } from "@/theme";

export const ALL_BRANCH_ID = "__ALL__";

interface Props {
  branches: Branch[];
  value?: string | null;
  defaultValue?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string | null) => void;
  placeholder?: string;
  hideAllOption?: boolean;
  style?: StyleProp<ViewStyle>;
  renderItem?: (item: Branch, selected?: boolean) => React.ReactElement | null;
}

const ALL_BRANCH_OPTION: Branch = {
  id: ALL_BRANCH_ID,
  city: "Chưa chọn chi nhánh",
  branchCode: "",
  phoneNumber: "",
  email: "",
  address: "Hiển thị thực đơn và giá chung",
  latitude: "",
  longitude: "",
  status: "",
  openTime: "",
  closeTime: "",
};

export function BranchDropdown({
  branches,
  value,
  defaultValue,
  onSelect,
  onChange,
  placeholder = "Chọn chi nhánh",
  hideAllOption = false,
  style,
  renderItem,
}: Props) {
  const [internalSelectedId, setInternalSelectedId] = useState<
    string | undefined
  >(
    defaultValue !== undefined
      ? defaultValue === null
        ? hideAllOption
          ? undefined
          : ALL_BRANCH_ID
        : defaultValue
      : undefined,
  );

  const data = useMemo(
    () => (hideAllOption ? branches : [ALL_BRANCH_OPTION, ...branches]),
    [branches, hideAllOption],
  );

  const activeValue =
    value !== undefined
      ? value === null
        ? hideAllOption
          ? undefined
          : ALL_BRANCH_ID
        : value
      : internalSelectedId;

  const renderDefaultItem = (item: Branch) => {
    const isSelected = activeValue === item.id;
    const isAll = item.id === ALL_BRANCH_ID;

    return (
      <View
        style={[
          styles.dropdownItemRow,
          isSelected && styles.dropdownItemSelectedRow,
        ]}
      >
        <Ionicons
          name={isAll ? "globe-outline" : "storefront-outline"}
          size={18}
          color={isSelected ? Colors.primary : Colors.outline}
          style={styles.dropdownItemIcon}
        />
        <View style={styles.dropdownItemTextCol}>
          <View style={styles.dropdownItemTitleRow}>
            <Text
              style={[
                styles.dropdownItemTitle,
                isSelected && styles.dropdownItemTitleSelected,
              ]}
              numberOfLines={1}
            >
              {item.city}
            </Text>
            {Boolean(item.branchCode) && (
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{item.branchCode}</Text>
              </View>
            )}
          </View>
          {Boolean(item.address) && (
            <Text style={styles.dropdownItemSub} numberOfLines={1}>
              {item.address}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark" size={18} color={Colors.primary} />
        )}
      </View>
    );
  };

  return (
    <Dropdown
      data={data}
      labelField="city"
      valueField="id"
      value={activeValue}
      placeholder={placeholder}
      search
      searchPlaceholder="Tìm chi nhánh..."
      renderItem={renderItem || renderDefaultItem}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      containerStyle={styles.dropdownContainer}
      onChange={(item: Branch) => {
        const rawId = item.id;
        const finalId = rawId === ALL_BRANCH_ID ? null : rawId;

        setInternalSelectedId(rawId);

        onSelect?.(finalId);
        onChange?.(finalId);
      }}
      style={[styles.dropdown, style]}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  dropdownContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    overflow: "hidden",
    ...Shadows.elevated,
  },
  placeholderStyle: {
    ...Typography.bodyMd,
    color: Colors.outline,
    fontSize: 14,
  },
  selectedTextStyle: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: Radius.md,
    borderColor: Colors.borderSoft,
  },
  dropdownItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  dropdownItemSelectedRow: {
    backgroundColor: "rgba(126, 37, 22, 0.05)",
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemTextCol: {
    flex: 1,
  },
  dropdownItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dropdownItemTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontSize: 14,
  },
  dropdownItemTitleSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  codeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(126, 37, 22, 0.08)",
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  dropdownItemSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
    marginTop: 2,
  },
});

