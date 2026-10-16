import { Brand } from "../types/Brand";
import { Dropdown } from "react-native-element-dropdown";
import { useState, useMemo } from "react";
import { StyleSheet } from "react-native";

export const ALL_BRAND_ID = "__ALL__";

interface Props {
  brands: Brand[];
  value?: string | null;
  defaultValue?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (id: string | null) => void;
  placeholder?: string;
}

const ALL_BRAND_OPTION: Brand = {
  id: ALL_BRAND_ID,
  name: "Tất cả",
  description: "Tất cả hãng",
};

export function BrandDropdown({
  brands,
  value,
  defaultValue,
  onSelect,
  onChange,
  placeholder = "Chọn hãng",
}: Props) {
  const [internalSelectedId, setInternalSelectedId] = useState<
    string | undefined
  >(
    defaultValue !== undefined
      ? defaultValue === null
        ? ALL_BRAND_ID
        : defaultValue
      : undefined,
  );

  const data = useMemo(() => [ALL_BRAND_OPTION, ...brands], [brands]);

  const activeValue =
    value !== undefined
      ? value === null
        ? ALL_BRAND_ID
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
      searchPlaceholder="Tìm hãng..."
      onChange={(item: Brand) => {
        const rawId = item.id;
        const finalId = rawId === ALL_BRAND_ID ? null : rawId;

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
