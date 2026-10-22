import { useState, useEffect, useCallback } from "react";
import { Wishlist, WishlistItem } from "../types/Wishlist";
import { Product } from "@/features/catalog/products";
import {
  fetchWishlist,
  addWishlistItem,
  removeWishlistItem,
  moveAllToCart as moveAllToCartApi,
} from "../api/wishlistApi";
import { getSelectedBranchId } from "@/features/territory/branches";
import { useAuth } from "@/features/auth";

export interface UseWishlistOptions {
  branchId?: string | null;
  sessionId?: string | null;
  enabled?: boolean;
}

/**
 * Normalizes wishlist items regardless of whether the backend returns `wishlistItems` or `items`.
 */
function getNormalizedItems(wishlist: Wishlist | null | undefined): WishlistItem[] {
  if (!wishlist) return [];
  return wishlist.wishlistItems || wishlist.items || [];
}

/**
 * Merges incoming wishlist items with existing product catalog details.
 * Prevents unitPrice, name, currency, and images from being wiped out
 * when the backend returns items without catalog enrichment.
 */
function mergeWishlistWithProducts(
  incomingWishlist: Wishlist | null | undefined,
  currentWishlist: Wishlist | null,
): Wishlist | null {
  if (!incomingWishlist) return currentWishlist;

  const incomingItems = getNormalizedItems(incomingWishlist);
  const currentItems = getNormalizedItems(currentWishlist);

  const productMap = new Map<string, Product>();
  if (currentItems.length > 0) {
    for (const item of currentItems) {
      if (item.product && item.product.unitPrice !== undefined) {
        if (item.product.id) productMap.set(item.product.id, item.product);
        if (item.productId) productMap.set(item.productId, item.product);
        if (item.id) productMap.set(item.id, item.product);
      }
    }
  }

  const mergedItems = incomingItems.map((newItem) => {
    const pid = newItem.product?.id || newItem.productId || newItem.id;
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
  });

  return {
    ...incomingWishlist,
    wishlistItems: mergedItems,
    items: mergedItems,
  };
}

export function useWishlist(
  branchIdOrOptions?: string | null | UseWishlistOptions,
  hookOptions?: UseWishlistOptions,
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

  const { token, user } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMovingAll, setIsMovingAll] = useState<boolean>(false);
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

        const res = await fetchWishlist({
          branchId: targetBranchId,
          sessionId: resolvedSessionId,
        });
        setWishlist((current) =>
          mergeWishlistWithProducts(res?.data ?? null, current),
        );
      } catch (err: any) {
        setError(err?.message || "Không thể tải danh sách yêu thích");
      } finally {
        setIsLoading(false);
      }
    },
    [initialBranchId, resolvedSessionId],
  );

  const isInWishlist = useCallback(
    (productId: string) => {
      if (!wishlist || !productId) return false;
      const items = getNormalizedItems(wishlist);
      return items.some((item) => {
        const pid = item.product?.id || item.productId || item.id;
        return pid === productId || item.id === productId;
      });
    },
    [wishlist],
  );

  const addItem = useCallback(
    async (
      productOrId: string | Product,
      customBranchId?: string | null,
    ) => {
      const productId = typeof productOrId === "string" ? productOrId : productOrId?.id;
      if (!productId) return false;

      let targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      // Optimistic add if full product object is provided
      const productObj = typeof productOrId === "object" ? productOrId : undefined;
      let previousSnapshot: Wishlist | null = null;

      if (productObj) {
        setWishlist((prev) => {
          previousSnapshot = prev;
          const currentItems = getNormalizedItems(prev);
          if (currentItems.some((it) => (it.product?.id || it.productId || it.id) === productId)) {
            return prev;
          }
          const newItem: WishlistItem = {
            id: `temp-${Date.now()}`,
            productId,
            product: productObj,
          };
          const updatedItems = [newItem, ...currentItems];
          return {
            id: prev?.id || "wishlist",
            wishlistItems: updatedItems,
            items: updatedItems,
          };
        });
      }

      try {
        setError(null);
        const res = await addWishlistItem(
          { productId },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );

        if (res?.data) {
          setWishlist((current) =>
            mergeWishlistWithProducts(res.data, current || previousSnapshot),
          );
        }

        // Background sync to ensure catalog details are fully enriched
        try {
          const synced = await fetchWishlist({
            branchId: targetBranchId,
            sessionId: resolvedSessionId,
          });
          if (synced?.data) {
            setWishlist((current) =>
              mergeWishlistWithProducts(synced.data, current),
            );
          }
        } catch {
          // ignore background sync error
        }

        return true;
      } catch (err: any) {
        if (previousSnapshot) {
          setWishlist(previousSnapshot);
        }
        setError(err?.message || "Không thể thêm vào danh sách yêu thích");
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

      let previousSnapshot: Wishlist | null = null;
      // Optimistic remove
      setWishlist((prev) => {
        previousSnapshot = prev;
        if (!prev) return prev;
        const currentItems = getNormalizedItems(prev);
        const filtered = currentItems.filter((item) => {
          const pid = item.product?.id || item.productId || item.id;
          return pid !== productId && item.id !== productId;
        });
        return {
          ...prev,
          wishlistItems: filtered,
          items: filtered,
        };
      });

      try {
        setError(null);
        const res = await removeWishlistItem(
          { productId },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );

        if (res?.data) {
          setWishlist((current) =>
            mergeWishlistWithProducts(res.data, current || previousSnapshot),
          );
        }

        // Background sync
        try {
          const synced = await fetchWishlist({
            branchId: targetBranchId,
            sessionId: resolvedSessionId,
          });
          if (synced?.data) {
            setWishlist((current) =>
              mergeWishlistWithProducts(synced.data, current),
            );
          }
        } catch {
          // ignore background sync error
        }

        return true;
      } catch (err: any) {
        if (previousSnapshot) {
          setWishlist(previousSnapshot);
        }
        setError(err?.message || "Không thể xóa khỏi danh sách yêu thích");
        return false;
      }
    },
    [initialBranchId, resolvedSessionId],
  );

  const toggleItem = useCallback(
    async (
      productOrId: string | Product,
      customBranchId?: string | null,
    ) => {
      const productId = typeof productOrId === "string" ? productOrId : productOrId?.id;
      if (!productId) return false;
      if (isInWishlist(productId)) {
        return await removeItem(productId, customBranchId);
      } else {
        return await addItem(productOrId, customBranchId);
      }
    },
    [isInWishlist, removeItem, addItem],
  );

  const moveAllToCart = useCallback(
    async (customBranchId?: string | null) => {
      let targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      if (targetBranchId === undefined) {
        targetBranchId = await getSelectedBranchId();
      }

      try {
        setIsMovingAll(true);
        setError(null);
        const res = await moveAllToCartApi({
          branchId: targetBranchId,
          sessionId: resolvedSessionId,
        });

        if (res?.isSucceed || res?.data) {
          // Clear wishlist locally because all items are now moved to cart
          setWishlist((prev) =>
            prev
              ? {
                  ...prev,
                  wishlistItems: [],
                  items: [],
                }
              : null,
          );

          // Background sync to ensure local state reflects the server state
          try {
            const synced = await fetchWishlist({
              branchId: targetBranchId,
              sessionId: resolvedSessionId,
            });
            if (synced?.data) {
              setWishlist((current) =>
                mergeWishlistWithProducts(synced.data, current),
              );
            }
          } catch {
            // ignore background sync error
          }

          return { success: true, cart: res.data };
        } else {
          const errMsg = res?.message || "Không thể chuyển tất cả vào giỏ hàng";
          setError(errMsg);
          return { success: false, error: errMsg };
        }
      } catch (err: any) {
        const errMsg = err?.message || "Không thể chuyển tất cả vào giỏ hàng";
        setError(errMsg);
        return { success: false, error: errMsg };
      } finally {
        setIsMovingAll(false);
      }
    },
    [initialBranchId, resolvedSessionId],
  );

  useEffect(() => {
    setWishlist(null);
    if (enabled) {
      loadData();
    }
  }, [token, user?.id, enabled, loadData]);

  return {
    wishlist,
    isLoading: !enabled || isLoading,
    isMovingAll,
    error,
    refresh: loadData,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    moveAllToCart,
  };
}
