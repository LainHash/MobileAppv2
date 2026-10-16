import { Brand } from "@/features/catalog/brands";
import { Category } from "@/features/catalog/categories";
import { Branch } from "@/features/territory/branches";
import { Product } from "@/features/catalog/products";

export interface Home {
  brands: Brand[];
  productCategories: Category[];
  branches: Branch[];
  products: Product[];
}
