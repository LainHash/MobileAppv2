import { Category } from "@/features/catalog/categories";
import { Branch } from "@/features/territory/branches";
import { Product } from "@/features/catalog/products";

export interface Home {
  productCategories: Category[];
  branches: Branch[];
  products: Product[];
  recommendedProducts: Product[];
  recommendedProduct?: Product[];
}
