import { Brand } from "../types/Brand";
import { Dropdown } from "react-native-element-dropdown";
import { useState } from "react";
import { StyleSheet } from "react-native";

interface Props {
  brands: Brand[];
}

export function BrandDropdown({ brands }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <>
      <Dropdown
        data={brands}
        labelField="name"
        valueField="id"
        value={selectedId}
        placeholder="Chọn hãng"
        search
        searchPlaceholder="Tìm hãng..."
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
