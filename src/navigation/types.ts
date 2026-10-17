import { Product } from "@/features/catalog/products";

export type RootStackParamList = {
  Home: undefined;
  Menu:
    | {
        categoryId?: string | null;
        brandId?: string | null;
        branchId?: string | null;
      }
    | undefined;
  ProductDetail: {
    productId: string;
    product?: Product;
    branchId?: string | null;
  };
  Cart:
    | {
        branchId?: string | null;
      }
    | undefined;
  Wishlist:
    | {
        branchId?: string | null;
      }
    | undefined;
};
