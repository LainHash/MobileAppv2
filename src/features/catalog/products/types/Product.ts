import { ProductImage } from "@/features/storage";

export interface Product {
  id: string;
  name: string;
  categoryName: string;
  brandName: string;
  description: string;
  inventoryType: string;
  unitSymbol: string;
  unitPrice?: number;
  currency?: string;
  stockStatus: string;
  isRecommended?: boolean;
  primaryImage?: ProductImage;
  images: ProductImage[];
}
