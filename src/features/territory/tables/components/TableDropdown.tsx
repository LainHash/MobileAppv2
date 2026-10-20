import React, { useMemo } from "react";
import { StyleSheet, StyleProp, ViewStyle, View, Text } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { RestaurantTable, TableStatus } from "../types/Table";

export const AUTO_TABLE_ID = "__AUTO__";

interface Props {
  tables: RestaurantTable[];
  value?: string | null;
  onSelect?: (id: string | null) => void;
  partySize?: number;
  placeholder?: string;
  allowAutoOption?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface TableDropdownItem {
  id: string;
  label: string;
  capacity?: number;
  areaName?: string;
  isAuto?: boolean;
}

const AUTO_TABLE_OPTION: TableDropdownItem = {
  id: AUTO_TABLE_ID,
  label: "✨ Tự động sắp xếp (Nhà hàng chọn bàn phù hợp)",
  isAuto: true,
};

export function TableDropdown({
  tables,
  value,
  onSelect,
  partySize,
  placeholder = "Chọn bàn (hoặc tự động sắp xếp)",
  allowAutoOption = true,
  disabled = false,
  isLoading = false,
  style,
}: Props) {
  const availableTables = useMemo(() => {
    return tables.filter(
      (t) => t.status === TableStatus.Available || t.id === value,
    );
  }, [tables, value]);

  const data: TableDropdownItem[] = useMemo(() => {
    const list: TableDropdownItem[] = availableTables.map((t) => ({
      id: t.id,
      label: `Bàn ${t.tableNumber} (${t.capacity} khách)${t.areaName ? ` • ${t.areaName}` : ""}`,
      capacity: t.capacity,
      areaName: t.areaName,
      isAuto: false,
    }));

    return allowAutoOption ? [AUTO_TABLE_OPTION, ...list] : list;
  }, [availableTables, allowAutoOption]);

  const activeValue =
    !value && allowAutoOption ? AUTO_TABLE_ID : value || undefined;

  const renderDropdownItem = (item: TableDropdownItem, selected?: boolean) => {
    const isUnderCapacity =
      !item.isAuto &&
      partySize &&
      item.capacity &&
      item.capacity < partySize;

    return (
      <View
        style={[
          styles.itemRow,
          selected && styles.itemRowSelected,
        ]}
      >
        <Text style={styles.itemIcon}>{item.isAuto ? "✨" : "🪑"}</Text>
        <View style={styles.itemTextWrap}>
          <Text
            style={[
              styles.itemLabel,
              selected && styles.itemLabelSelected,
              item.isAuto && styles.autoLabel,
            ]}
          >
            {item.label}
          </Text>
          {Boolean(isUnderCapacity) && (
            <Text style={styles.warningText}>
              ⚠️ Sức chứa ({item.capacity} chỗ) nhỏ hơn số khách ({partySize})
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={disabled && styles.disabledContainer}>
      <Dropdown
        data={data}
        labelField="label"
        valueField="id"
        value={activeValue}
        placeholder={
          isLoading
            ? "Đang tải danh sách bàn..."
            : disabled
              ? "Vui lòng chọn chi nhánh trước"
              : placeholder
        }
        disable={disabled || isLoading}
        search={!disabled && data.length > 5}
        searchPlaceholder="Tìm bàn..."
        onChange={(item: TableDropdownItem) => {
          const finalId = item.id === AUTO_TABLE_ID ? null : item.id;
          onSelect?.(finalId);
        }}
        renderItem={renderDropdownItem}
        renderLeftIcon={() => (
          <Text style={styles.leftIcon}>{disabled ? "🔒" : "🪑"}</Text>
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  itemRowSelected: {
    backgroundColor: "#EFF6FF",
  },
  itemIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    color: "#1E293B",
  },
  itemLabelSelected: {
    fontWeight: "600",
    color: "#007AFF",
  },
  autoLabel: {
    fontWeight: "600",
    color: "#0284C7",
  },
  warningText: {
    fontSize: 11,
    color: "#E11D48",
    marginTop: 2,
  },
});
