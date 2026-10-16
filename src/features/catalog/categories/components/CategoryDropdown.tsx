import { Category } from "../types/Category";
import { Dropdown } from "react-native-element-dropdown";
import { useState, useMemo } from "react";
import { StyleSheet } from "react-native";

export const ALL_CATEGORY_ID = "__ALL__";

interface Props {
  categories: Category[];
  value?: string | null;
  defaultValue?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string | null) => void;
  placeholder?: string;
}

const ALL_CATEGORY_OPTION: Category = {
  id: ALL_CATEGORY_ID,
  name: "Tất cả",
  description: "Tất cả danh mục",
};

export function CategoryDropdown({
  categories,
  value,
  defaultValue,
  onSelect,
  onChange,
  placeholder = "Chọn danh mục",
}: Props) {
  const [internalSelectedId, setInternalSelectedId] = useState<
    string | undefined
  >(
    defaultValue !== undefined
      ? defaultValue === null
        ? ALL_CATEGORY_ID
        : defaultValue
      : undefined,
  );

  const data = useMemo(
    () => [ALL_CATEGORY_OPTION, ...categories],
    [categories],
  );

  const activeValue =
    value !== undefined
      ? value === null
        ? ALL_CATEGORY_ID
        : value
      : internalSelectedId;

  return (
    <Dropdown
      data={data}
      labelField="name"
      valueField="id"
      value={activeValue}
      placeholder={placeholder}
      search
      searchPlaceholder="Tìm danh mục..."
      onChange={(item: Category) => {
        const rawId = item.id;
        const finalId = rawId === ALL_CATEGORY_ID ? null : rawId;

        setInternalSelectedId(rawId);

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
