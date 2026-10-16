import { CategoryDropdown } from "@/features/catalog/categories";
import { BrandDropdown } from "@/features/catalog/brands";
import { Category } from "@/features/catalog/categories";
import { Brand } from "@/features/catalog/brands";

interface Props {
  categories: Category[];
  brands: Brand[];
  selectedCategoryId?: string | null;
  selectedBrandId?: string | null;
  onSelectCategory?: (id: string | null) => void;
  onSelectBrand?: (id: string | null) => void;
}

export default function HomeDropdownSelection({
  categories,
  brands,
  selectedCategoryId,
  selectedBrandId,
  onSelectCategory,
  onSelectBrand,
}: Props) {
  return (
    <>
      <CategoryDropdown
        categories={categories}
        value={selectedCategoryId}
        onSelect={onSelectCategory}
      />
      <BrandDropdown
        brands={brands}
        value={selectedBrandId}
        onSelect={onSelectBrand}
      />
    </>
  );
}

