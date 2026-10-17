import { useState, useEffect, useCallback } from "react";
import { Cart } from "../types/Cart";
import { Product } from "@/features/catalog/products";
import {
  fetchCart,
  addCartItem,
  removeCartItem,
  updateCartItemQuantity,
} from "../api/cartApi";
import { getSelectedBranchId } from "@/features/territory/branches";

export interface UseCartOptions {
  branchId?: string | null;
  sessionId?: string | null;
  enabled?: boolean;
}

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

      // Keep incoming product if it already has valid unitPrice; otherwise use cachedProduct
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

export function useCart(
  branchIdOrOptions?: string | null | UseCartOptions,
  hookOptions?: UseCartOptions,
) {
  let initialBranchId: string | null | undefined;
  let resolvedSessionId: string | null | undefined;
  let enabled = true;

  if (typeof branchIdOrOptions === "string" || branchIdOrOptions === null) {
    initialBranchId = branchIdOrOptions;
    enabled = hookOptions?.enabled ?? true;
    resolvedSessionId = hookOptions?.sessionId;
  } else if (branchIdOrOptions) {
    initialBranchId = branchIdOrOptions.branchId;
    resolvedSessionId = branchIdOrOptions.sessionId;
    enabled = branchIdOrOptions.enabled ?? true;
  }

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (customBranchId?: string | null) => {
      try {
        setIsLoading(true);
        setError(null);

        let targetBranchId =
          customBranchId !== undefined ? customBranchId : initialBranchId;
        if (targetBranchId === undefined) {
          targetBranchId = await getSelectedBranchId();
        }

        const res = await fetchCart({
          branchId: targetBranchId,
          sessionId: resolvedSessionId,
        });
        setCart((current) => mergeCartWithProducts(res?.data ?? null, current));
      } catch (err: any) {
        setError(err?.message || "Không thể tải giỏ hàng");
      } finally {
        setIsLoading(false);
      }
    },
    [initialBranchId, resolvedSessionId],
  );

  const addItem = useCallback(
    async (productId: string, customBranchId?: string | null) => {
      if (!productId) return false;

      let targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      try {
        setError(null);
        const res = await addCartItem(
          { productId },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );
        if (res?.data) {
          setCart((current) => mergeCartWithProducts(res.data, current));
        }

        // Fetch full cart to get complete catalog details for the new product
        try {
          const synced = await fetchCart({
            branchId: targetBranchId,
            sessionId: resolvedSessionId,
          });
          if (synced?.data) {
            setCart((current) => mergeCartWithProducts(synced.data, current));
          }
        } catch {
          // ignore background sync error
        }

        return true;
      } catch (err: any) {
        setError(err?.message || "Không thể thêm vào giỏ hàng");
        return false;
      }
    },
    [initialBranchId, resolvedSessionId],
  );

  const removeItem = useCallback(
    async (productId: string, customBranchId?: string | null) => {
      if (!productId) return false;

      let targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      let previousSnapshot: Cart | null = null;
      // Optimistic remove
      setCart((prev) => {
        previousSnapshot = prev;
        if (!prev) return prev;
        return {
          ...prev,
          cartItems: prev.cartItems.filter((item) => {
            const pid =
              item.product?.id || item.productId || item.id;
            return pid !== productId && item.id !== productId;
          }),
        };
      });

      try {
        setError(null);
        const res = await removeCartItem(
          { productId },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );
        if (res?.data) {
          setCart((current) =>
            mergeCartWithProducts(res.data, current || previousSnapshot),
          );
        }

        // Background sync with server
        try {
          const synced = await fetchCart({
            branchId: targetBranchId,
            sessionId: resolvedSessionId,
          });
          if (synced?.data) {
            setCart((current) => mergeCartWithProducts(synced.data, current));
          }
        } catch {
          // ignore background sync error
        }

        return true;
      } catch (err: any) {
        if (previousSnapshot) {
          setCart(previousSnapshot);
        }
        setError(err?.message || "Không thể xóa sản phẩm khỏi giỏ hàng");
        return false;
      }
    },
    [initialBranchId, resolvedSessionId],
  );

  const updateQuantity = useCallback(
    async (
      productId: string,
      quantity: number,
      customBranchId?: string | null,
    ) => {
      if (!productId) {
        console.warn("updateQuantity called without productId");
        return false;
      }

      let targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      // 1. Optimistic update: instantly update quantity and total price on UI
      let previousSnapshot: Cart | null = null;
      setCart((prev) => {
        previousSnapshot = prev;
        if (!prev) return prev;
        return {
          ...prev,
          cartItems: prev.cartItems.map((item) => {
            const pid =
              item.product?.id || item.productId || item.id;
            if (pid === productId || item.id === productId) {
              return { ...item, quantity };
            }
            return item;
          }),
        };
      });

      try {
        setError(null);
        const res = await updateCartItemQuantity(
          { productId, quantity },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );

        if (res?.data) {
          // Merge incoming cart with previous product details so prices are NEVER wiped out
          setCart((current) =>
            mergeCartWithProducts(res.data, current || previousSnapshot),
          );
        }

        // Background sync with server
        try {
          const synced = await fetchCart({
            branchId: targetBranchId,
            sessionId: resolvedSessionId,
          });
          if (synced?.data) {
            setCart((current) => mergeCartWithProducts(synced.data, current));
          }
        } catch {
          // Keep optimistic/merged state if background sync has network glitch
        }

        return true;
      } catch (err: any) {
        // Revert to snapshot on network/server error
        if (previousSnapshot) {
          setCart(previousSnapshot);
        }
        setError(err?.message || "Không thể cập nhật số lượng");
        return false;
      }
    },
    [initialBranchId, resolvedSessionId],
  );

  useEffect(() => {
    if (enabled) {
      loadData();
    }
  }, [enabled, loadData]);

  return {
    cart,
    isLoading: !enabled || isLoading,
    error,
    refresh: loadData,
    addItem,
    removeItem,
    updateQuantity,
  };
}
