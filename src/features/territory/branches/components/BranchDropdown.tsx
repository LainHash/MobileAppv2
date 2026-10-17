import { Branch } from "../types/Branch";
import { Dropdown } from "react-native-element-dropdown";
import { useState, useMemo } from "react";
import { StyleSheet, StyleProp, ViewStyle } from "react-native";

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
  city: "Chưa chọn",
  branchCode: "",
  phoneNumber: "",
  email: "",
  address: "",
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

  return (
    <Dropdown
      data={data}
      labelField="city"
      valueField="id"
      value={activeValue}
      placeholder={placeholder}
      search
      searchPlaceholder="Tìm chi nhánh..."
      renderItem={renderItem}
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
    margin: 16,
    height: 50,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    cursor: "pointer",
  },
});
