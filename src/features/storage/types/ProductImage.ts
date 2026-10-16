import { Image } from "./Image";

export interface ProductImage {
  id: string;
  isPrimary: boolean;
  displayOrder: number;
  image: Image;
}
