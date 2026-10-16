import { ProductImage } from "@/features/storage";

export interface Product {
  id: string;
  name: string;
  description: string;
  inventoryType: string;
  unitSymbol: string;
  unitPrice?: number;
  currency?: string;
  stockStatus: string;
  primaryImage?: ProductImage;
  images: ProductImage[];
}
