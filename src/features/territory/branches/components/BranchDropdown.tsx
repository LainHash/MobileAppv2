import { Branch } from "../types/Branch";
import { Dropdown } from "react-native-element-dropdown";
import { useState, useMemo } from "react";
import { StyleSheet } from "react-native";

export const ALL_BRANCH_ID = "__ALL__";

interface Props {
  branches: Branch[];
  value?: string | null;
  defaultValue?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string | null) => void;
  placeholder?: string;
}

const ALL_BRANCH_OPTION: Branch = {
  id: ALL_BRANCH_ID,
  city: "Chưa chọn",
  branchCode: "",
  phoneNumber: "",
  email: "",
  address: "",
  latitude: "",
  logitude: "",
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
}: Props) {
  const [internalSelectedId, setInternalSelectedId] = useState<
    string | undefined
  >(
    defaultValue !== undefined
      ? defaultValue === null
        ? ALL_BRANCH_ID
        : defaultValue
      : undefined,
  );

  const data = useMemo(() => [ALL_BRANCH_OPTION, ...branches], [branches]);

  const activeValue =
    value !== undefined
      ? value === null
        ? ALL_BRANCH_ID
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
      onChange={(item: Branch) => {
        const rawId = item.id;
        const finalId = rawId === ALL_BRANCH_ID ? null : rawId;

        setInternalSelectedId(rawId);
        console.log("Selected Branch ID:", finalId);

        onSelect?.(finalId);
        onChange?.(finalId);
      }}
      style={styles.dropdown}
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
