import { useState, useEffect, useCallback } from "react";
import { Cart } from "../types/Cart";
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
        setCart(res?.data ?? null);
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
      try {
        let targetBranchId =
          customBranchId !== undefined ? customBranchId : initialBranchId;
        if (targetBranchId === undefined) {
          targetBranchId = await getSelectedBranchId();
        }
        const res = await addCartItem(
          { productId },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );
        if (res?.data) {
          setCart(res.data);
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
      try {
        let targetBranchId =
          customBranchId !== undefined ? customBranchId : initialBranchId;
        if (targetBranchId === undefined) {
          targetBranchId = await getSelectedBranchId();
        }
        const res = await removeCartItem(
          { productId },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );
        if (res?.data) {
          setCart(res.data);
        }
        return true;
      } catch (err: any) {
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
      try {
        let targetBranchId =
          customBranchId !== undefined ? customBranchId : initialBranchId;
        if (targetBranchId === undefined) {
          targetBranchId = await getSelectedBranchId();
        }
        const res = await updateCartItemQuantity(
          { productId, quantity },
          { branchId: targetBranchId, sessionId: resolvedSessionId },
        );
        if (res?.data) {
          setCart(res.data);
        }
        return true;
      } catch (err: any) {
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
