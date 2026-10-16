import { CategoryDropdown } from "@/features/catalog/categories";
import { BrandDropdown } from "@/features/catalog/brands";
import { Category } from "@/features/catalog/categories";
import { Brand } from "@/features/catalog/brands";

interface Props {
  categories: Category[];
  brands: Brand[];
}

export default function HomeDropdownSelection({ categories, brands }: Props) {
  return (
    <>
      <CategoryDropdown categories={categories} />
      <BrandDropdown brands={brands} />
    </>
  );
}
