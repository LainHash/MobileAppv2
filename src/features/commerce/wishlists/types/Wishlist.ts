import { Product } from "@/features/catalog/products";

export interface Wishlist {
  id: string;
  wishlistItems: WishlistItem[];
  items?: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  product: Product;
  productId?: string;
}

export interface AddWishlistItemRequest {
  productId: string; // uuid v4
}

export interface RemoveWishlistItemRequest {
  productId: string; // uuid v4
}
