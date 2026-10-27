import { create } from "zustand";
import { Cart, CartItem } from "../types/Cart";
import { Product } from "@/features/catalog/products";
import {
  fetchCart,
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
} from "../api/cartApi";
import { getSelectedBranchId } from "@/features/territory/branches";

/**
 * Merges incoming cart items with existing product catalog details.
 * Prevents unitPrice, name, currency, and images from being wiped out
 * when the backend returns cart items without catalog enrichment.
 */
function mergeCartWithProducts(
  incomingCart: Cart | null | undefined,
  currentCart: Cart | null,
): Cart | null {
  if (!incomingCart) return currentCart;
  if (!incomingCart.cartItems) return incomingCart;

  const productMap = new Map<string, Product>();
  if (currentCart?.cartItems) {
    for (const item of currentCart.cartItems) {
      if (item.product && item.product.unitPrice !== undefined) {
        if (item.product.id) productMap.set(item.product.id, item.product);
        if (item.productId) productMap.set(item.productId, item.product);
        if (item.id) productMap.set(item.id, item.product);
      }
    }
  }

  return {
    ...incomingCart,
    cartItems: incomingCart.cartItems.map((newItem) => {
      const pid =
        newItem.product?.id ||
        newItem.productId ||
        newItem.id;

      const cachedProduct = pid ? productMap.get(pid) : undefined;
      const product =
        newItem.product && newItem.product.unitPrice !== undefined
          ? newItem.product
          : cachedProduct || newItem.product;

      return {
        ...newItem,
        productId: newItem.productId || newItem.product?.id || newItem.id,
        product: product as Product,
      };
    }),
  };
}

export interface CartStoreState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  totalQuantity: number;
  totalPrice: number;

  loadCart: (
    branchId?: string | null,
    sessionId?: string | null,
  ) => Promise<void>;
  addItem: (
    productId: string,
    options?: {
      branchId?: string | null;
      sessionId?: string | null;
      product?: Product;
    },
  ) => Promise<boolean>;
  removeItem: (
    productId: string,
    options?: { branchId?: string | null; sessionId?: string | null },
  ) => Promise<boolean>;
  updateQuantity: (
    productId: string,
    quantity: number,
    options?: { branchId?: string | null; sessionId?: string | null },
  ) => Promise<boolean>;
  clearCartState: () => void;
}

export const useCartStore = create<CartStoreState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,
  totalQuantity: 0,
  totalPrice: 0,

  loadCart: async (branchId, sessionId) => {
    try {
      set({ isLoading: true, error: null });
      let targetBranchId = branchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      const res = await fetchCart({ branchId: targetBranchId, sessionId });
      const current = get().cart;
      const merged = mergeCartWithProducts(res?.data ?? null, current);

      const totalQuantity =
        merged?.cartItems?.reduce((acc, it) => acc + (it.quantity || 0), 0) ??
        0;
      const totalPrice =
        merged?.cartItems?.reduce(
          (acc, it) =>
            acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
          0,
        ) ?? 0;

      set({
        cart: merged,
        totalQuantity,
        totalPrice,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || "Không thể tải giỏ hàng",
        isLoading: false,
      });
    }
  },

  addItem: async (productId, options) => {
    if (!productId) return false;
    const current = get().cart;

    // Instant Optimistic item increment
    if (options?.product) {
      const existingItem = current?.cartItems?.find(
        (it) => (it.productId || it.product?.id || it.id) === productId,
      );
      let updatedItems: CartItem[] = [];
      if (existingItem) {
        updatedItems = (current?.cartItems || []).map((it) =>
          (it.productId || it.product?.id || it.id) === productId
            ? { ...it, quantity: it.quantity + 1 }
            : it,
        );
      } else {
        const newItem: CartItem = {
          id: productId,
          productId,
          product: options.product,
          quantity: 1,
        };
        updatedItems = [...(current?.cartItems || []), newItem];
      }
      const optimisticCart: Cart = {
        id: current?.id || "temp",
        cartItems: updatedItems,
      };
      const totalQuantity = updatedItems.reduce(
        (acc, it) => acc + (it.quantity || 0),
        0,
      );
      const totalPrice = updatedItems.reduce(
        (acc, it) =>
          acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
        0,
      );
      set({ cart: optimisticCart, totalQuantity, totalPrice });
    }

    try {
      let targetBranchId = options?.branchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      const res = await addCartItem(
        { productId },
        { branchId: targetBranchId, sessionId: options?.sessionId },
      );

      const latestCurrent = get().cart;
      const merged = mergeCartWithProducts(res?.data, latestCurrent);
      if (merged) {
        const totalQuantity =
          merged.cartItems?.reduce(
            (acc, it) => acc + (it.quantity || 0),
            0,
          ) ?? 0;
        const totalPrice =
          merged.cartItems?.reduce(
            (acc, it) =>
              acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
            0,
          ) ?? 0;
        set({ cart: merged, totalQuantity, totalPrice });
      }

      // Sync full cart in background to ensure catalog completeness
      fetchCart({ branchId: targetBranchId, sessionId: options?.sessionId })
        .then((synced) => {
          if (synced?.data) {
            const finalMerged = mergeCartWithProducts(
              synced.data,
              get().cart,
            );
            if (finalMerged) {
              const qty =
                finalMerged.cartItems?.reduce(
                  (acc, it) => acc + (it.quantity || 0),
                  0,
                ) ?? 0;
              const price =
                finalMerged.cartItems?.reduce(
                  (acc, it) =>
                    acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
                  0,
                ) ?? 0;
              set({ cart: finalMerged, totalQuantity: qty, totalPrice: price });
            }
          }
        })
        .catch(() => {});

      return true;
    } catch (err: any) {
      set({ error: err?.message || "Không thể thêm vào giỏ hàng" });
      return false;
    }
  },

  removeItem: async (productId, options) => {
    if (!productId) return false;
    const previous = get().cart;
    if (!previous) return false;

    // Instant optimistic removal (0ms UI latency)
    const filteredItems = (previous.cartItems || []).filter(
      (it) =>
        (it.product?.id || it.productId || it.id) !== productId &&
        it.id !== productId,
    );
    const optimisticCart = { ...previous, cartItems: filteredItems };
    const totalQuantity = filteredItems.reduce(
      (acc, it) => acc + (it.quantity || 0),
      0,
    );
    const totalPrice = filteredItems.reduce(
      (acc, it) =>
        acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
      0,
    );
    set({ cart: optimisticCart, totalQuantity, totalPrice });

    try {
      let targetBranchId = options?.branchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      const res = await removeCartItem(
        { productId },
        { branchId: targetBranchId, sessionId: options?.sessionId },
      );

      const merged = mergeCartWithProducts(res?.data, previous);
      if (merged) {
        const qty =
          merged.cartItems?.reduce(
            (acc, it) => acc + (it.quantity || 0),
            0,
          ) ?? 0;
        const price =
          merged.cartItems?.reduce(
            (acc, it) =>
              acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
            0,
          ) ?? 0;
        set({ cart: merged, totalQuantity: qty, totalPrice: price });
      }
      return true;
    } catch (err: any) {
      // Rollback on network failure
      if (previous) {
        const qty =
          previous.cartItems?.reduce(
            (acc, it) => acc + (it.quantity || 0),
            0,
          ) ?? 0;
        const price =
          previous.cartItems?.reduce(
            (acc, it) =>
              acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
            0,
          ) ?? 0;
        set({
          cart: previous,
          totalQuantity: qty,
          totalPrice: price,
          error: err?.message || "Không thể xóa sản phẩm",
        });
      }
      return false;
    }
  },

  updateQuantity: async (productId, quantity, options) => {
    if (!productId) return false;
    const previous = get().cart;
    if (!previous) return false;

    // Instant optimistic quantity update
    const updatedItems = (previous.cartItems || []).map((it) => {
      const pid = it.product?.id || it.productId || it.id;
      if (pid === productId || it.id === productId) {
        return { ...it, quantity };
      }
      return it;
    });

    const optimisticCart = { ...previous, cartItems: updatedItems };
    const totalQuantity = updatedItems.reduce(
      (acc, it) => acc + (it.quantity || 0),
      0,
    );
    const totalPrice = updatedItems.reduce(
      (acc, it) =>
        acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
      0,
    );
    set({ cart: optimisticCart, totalQuantity, totalPrice });

    try {
      let targetBranchId = options?.branchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      const res = await updateCartItemQuantity(
        { productId, quantity },
        { branchId: targetBranchId, sessionId: options?.sessionId },
      );

      const merged = mergeCartWithProducts(res?.data, previous);
      if (merged) {
        const qty =
          merged.cartItems?.reduce(
            (acc, it) => acc + (it.quantity || 0),
            0,
          ) ?? 0;
        const price =
          merged.cartItems?.reduce(
            (acc, it) =>
              acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
            0,
          ) ?? 0;
        set({ cart: merged, totalQuantity: qty, totalPrice: price });
      }
      return true;
    } catch (err: any) {
      if (previous) {
        const qty =
          previous.cartItems?.reduce(
            (acc, it) => acc + (it.quantity || 0),
            0,
          ) ?? 0;
        const price =
          previous.cartItems?.reduce(
            (acc, it) =>
              acc + (it.quantity || 0) * (it.product?.unitPrice || 0),
            0,
          ) ?? 0;
        set({
          cart: previous,
          totalQuantity: qty,
          totalPrice: price,
          error: err?.message || "Không thể cập nhật số lượng",
        });
      }
      return false;
    }
  },

  clearCartState: () => {
    set({ cart: null, totalQuantity: 0, totalPrice: 0, error: null });
  },
}));
