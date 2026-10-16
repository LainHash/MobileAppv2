import { ProductCategory } from "../types/Category";
import { Dropdown } from "react-native-element-dropdown";
import { useState } from "react";
import { StyleSheet } from "react-native";

interface Props {
  categories: ProductCategory[];
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function CategoryDropdown({ categories }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <>
      <Dropdown
        data={categories}
        labelField="name"
        valueField="id"
        value={selectedId}
        placeholder="Chọn danh mục"
        search
        searchPlaceholder="Tìm danh mục..."
        onChange={(item) => {
          setSelectedId(item.id);
          console.log("Selected ID:", item.id);
        }}
        style={styles.dropdown}
      />
    </>
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
