import { useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { useCartStore } from "../stores/cartStore";
import { Product } from "@/features/catalog/products";

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

  const { token, user } = useAuth();
  const cart = useCartStore((s) => s.cart);
  const isLoading = useCartStore((s) => s.isLoading);
  const error = useCartStore((s) => s.error);
  const loadCart = useCartStore((s) => s.loadCart);
  const addItemStore = useCartStore((s) => s.addItem);
  const removeItemStore = useCartStore((s) => s.removeItem);
  const updateQuantityStore = useCartStore((s) => s.updateQuantity);

  const loadData = useCallback(
    async (customBranchId?: string | null) => {
      const targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      await loadCart(targetBranchId, resolvedSessionId);
    },
    [initialBranchId, resolvedSessionId, loadCart],
  );

  const addItem = useCallback(
    async (
      productId: string,
      customBranchId?: string | null,
      product?: Product,
    ) => {
      const targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      return await addItemStore(productId, {
        branchId: targetBranchId,
        sessionId: resolvedSessionId,
        product,
      });
    },
    [initialBranchId, resolvedSessionId, addItemStore],
  );

  const removeItem = useCallback(
    async (productId: string, customBranchId?: string | null) => {
      const targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      return await removeItemStore(productId, {
        branchId: targetBranchId,
        sessionId: resolvedSessionId,
      });
    },
    [initialBranchId, resolvedSessionId, removeItemStore],
  );

  const updateQuantity = useCallback(
    async (
      productId: string,
      quantity: number,
      customBranchId?: string | null,
    ) => {
      const targetBranchId =
        customBranchId !== undefined ? customBranchId : initialBranchId;
      return await updateQuantityStore(productId, quantity, {
        branchId: targetBranchId,
        sessionId: resolvedSessionId,
      });
    },
    [initialBranchId, resolvedSessionId, updateQuantityStore],
  );

  useEffect(() => {
    if (enabled) {
      loadData();
    }
  }, [token, user?.id, enabled, loadData]);

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
