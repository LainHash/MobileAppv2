import { Product } from "@/features/catalog/products";

export interface Cart {
  id: string;
  cartItems: CartItem[];
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface AddCartItemRequest {
  productId: string; //uuid v4
}

export interface RemoveCartItemRequest {
  productId: string; //uuid v4
}

export interface UpdateCartItemQuantityRequest {
  productId: string; //uuid v4
  quantity: number;
}
