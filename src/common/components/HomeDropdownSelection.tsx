import { CategoryDropdown, Category } from "@/features/catalog/categories";
import { BranchDropdown, Branch } from "@/features/territory/branches";
import { View, StyleSheet, Text } from "react-native";

interface Props {
  categories: Category[];
  branches: Branch[];
  selectedCategoryId?: string | null;
  selectedBranchId?: string | null;
  onSelectCategory?: (id: string | null) => void;
  onSelectBranch?: (id: string | null) => void;
}

export default function HomeDropdownSelection({
  categories,
  branches,
  selectedCategoryId,
  selectedBranchId,
  onSelectCategory,
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
