import { useEffect, useState, useCallback } from "react";
import {
  kitchenHubService,
  OrderPreparationRealtimeEvent,
  BatchPreparationRealtimeEvent,
  OrderSyncedRealtimeEvent,
  NewOrderPlacedEvent,
} from "../api/kitchenHub.service";

export interface UseOrderRealtimeOptions {
  orderId?: string | null;
  branchId?: string | null;
  onItemStatusChanged?: (event: OrderPreparationRealtimeEvent) => void;
  onBatchStatusChanged?: (event: BatchPreparationRealtimeEvent) => void;
  onOrderSynced?: (event: OrderSyncedRealtimeEvent) => void;
  onNewOrder?: (event: NewOrderPlacedEvent) => void;
  enabled?: boolean;
}

export function useOrderRealtime(options: UseOrderRealtimeOptions = {}) {
  const {
    orderId,
    branchId,
    onItemStatusChanged,
    onBatchStatusChanged,
    onOrderSynced,
    onNewOrder,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState<boolean>(
    kitchenHubService.isConnected(),
  );
  const [lastEvent, setLastEvent] =
    useState<OrderPreparationRealtimeEvent | null>(null);

  useEffect(() => {
    if (!enabled) return;

    kitchenHubService.connect(branchId || undefined, orderId || undefined);

    const unsubConn = kitchenHubService.onConnectionChanged((connected) => {
      setIsConnected(connected);
    });

    const unsubItem = kitchenHubService.onItemPreparationStatusChanged((e) => {
      if (!orderId || e.orderId === orderId) {
        setLastEvent(e);
        if (onItemStatusChanged) onItemStatusChanged(e);
      }
    });

    const unsubBatch = kitchenHubService.onBatchPreparationStatusChanged((e) => {
      if (!orderId || e.orderId === orderId) {
        if (onBatchStatusChanged) onBatchStatusChanged(e);
      }
    });

    const unsubSynced = kitchenHubService.onOrderSyncedStatusChanged((e) => {
      if (!orderId || e.orderId === orderId) {
        if (onOrderSynced) onOrderSynced(e);
      }
    });

    const unsubNewOrder = kitchenHubService.onNewOrderPlaced((e) => {
      if (onNewOrder) onNewOrder(e);
    });

    if (orderId) {
      kitchenHubService.joinOrder(orderId);
    }

    return () => {
      if (orderId) {
        kitchenHubService.leaveOrder(orderId);
      }
      unsubConn();
      unsubItem();
      unsubBatch();
      unsubSynced();
      unsubNewOrder();
    };
  }, [
    enabled,
    orderId,
    branchId,
    onItemStatusChanged,
    onBatchStatusChanged,
    onOrderSynced,
    onNewOrder,
  ]);

  return {
    isConnected,
    lastEvent,
    joinOrder: useCallback(
      (id: string) => kitchenHubService.joinOrder(id),
      [],
    ),
    leaveOrder: useCallback(
      (id: string) => kitchenHubService.leaveOrder(id),
      [],
    ),
  };
}
