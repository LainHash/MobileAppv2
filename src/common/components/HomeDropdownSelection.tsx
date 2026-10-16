import { CategoryDropdown, Category } from "@/features/catalog/categories";
import { BrandDropdown, Brand } from "@/features/catalog/brands";
import { BranchDropdown, Branch } from "@/features/territory/branches";
import { View, StyleSheet, Text } from "react-native";

interface Props {
  categories: Category[];
  brands: Brand[];
  branches: Branch[];
  selectedCategoryId?: string | null;
  selectedBrandId?: string | null;
  selectedBranchId?: string | null;
  onSelectCategory?: (id: string | null) => void;
  onSelectBrand?: (id: string | null) => void;
  onSelectBranch?: (id: string | null) => void;
}

export default function HomeDropdownSelection({
  categories,
  brands,
  branches,
  selectedCategoryId,
  selectedBrandId,
  selectedBranchId,
  onSelectCategory,
  onSelectBrand,
  onSelectBranch,
}: Props) {
  return (
    <View style={styles.dropdownContainer}>
      <View style={styles.dropdownItem}>
        <Text style={styles.dropdownLabel}>Category</Text>
        <CategoryDropdown
          categories={categories}
          value={selectedCategoryId}
          onSelect={onSelectCategory}
        />
      </View>

      <View style={styles.dropdownItem}>
        <Text style={styles.dropdownLabel}>Brand</Text>
        <BrandDropdown
          brands={brands}
          value={selectedBrandId}
          onSelect={onSelectBrand}
        />
      </View>
      <View style={styles.dropdownItem}>
        <Text style={styles.dropdownLabel}>Branch</Text>
        <BranchDropdown
          branches={branches}
          value={selectedBranchId}
          onSelect={onSelectBranch}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dropdownItem: {
    flex: 1,
    gap: 6,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
