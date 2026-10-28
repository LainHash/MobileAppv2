import { getAuthToken } from "@/features/auth/utils/authStorage";
import { PreparationStatus, OrderStatus, OrderType } from "../types/order";

export interface OrderPreparationRealtimeEvent {
  orderId: string;
  orderItemId: string;
  productName: string;
  tableNumber: string | null;
  oldStatus: PreparationStatus | number;
  newStatus: PreparationStatus | number;
  orderType: OrderType | number;
  branchId: string;
  quantity: number;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  timestamp: string;
}

export interface BatchPreparationRealtimeEvent {
  orderId: string;
  itemIds: string[];
  status: PreparationStatus | number;
  branchId: string;
  timestamp: string;
}

export interface OrderSyncedRealtimeEvent {
  orderId: string;
  status: OrderStatus | number;
  branchId: string;
  tableNumber: string | null;
  timestamp: string;
}

export interface NewOrderPlacedEvent {
  orderId: string;
  branchId: string;
  tableNumber: string | null;
  orderType: string;
}

type ItemStatusCallback = (data: OrderPreparationRealtimeEvent) => void;
type BatchStatusCallback = (data: BatchPreparationRealtimeEvent) => void;
type OrderSyncedCallback = (data: OrderSyncedRealtimeEvent) => void;
type NewOrderCallback = (data: NewOrderPlacedEvent) => void;
type ConnectionCallback = (connected: boolean) => void;

class KitchenHubService {
  private socket: WebSocket | null = null;
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private activeBranchId: string | null = null;
  private activeOrderId: string | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  private itemStatusCallbacks: Set<ItemStatusCallback> = new Set();
  private batchStatusCallbacks: Set<BatchStatusCallback> = new Set();
  private orderSyncedCallbacks: Set<OrderSyncedCallback> = new Set();
  private newOrderCallbacks: Set<NewOrderCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();

  private async getHubUrl(): Promise<string> {
    const rawBaseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL || "https://api-restaurantservice.duckdns.org";

    const cleanBase = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    const wsProto = cleanBase.startsWith("https") ? "wss" : "ws";
    const host = cleanBase.replace(/^https?:\/\//, "");
    const token = await getAuthToken();
    const tokenParam = token ? `?access_token=${encodeURIComponent(token)}` : "";

    return `${wsProto}://${host}/hubs/kitchen${tokenParam}`;
  }

  public async connect(branchId?: string, orderId?: string): Promise<void> {
    if (branchId) this.activeBranchId = branchId;
    if (orderId) this.activeOrderId = orderId;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      if (branchId) this.joinBranch(branchId);
      if (orderId) this.joinOrder(orderId);
      return;
    }

    this.shouldReconnect = true;
    this.isConnecting = true;

    try {
      const url = await this.getHubUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnecting = false;
        // SignalR Handshake: JSON protocol version 1 (terminated by record separator 0x1E)
        this.sendRawMessage({ protocol: "json", version: 1 });

        // SignalR Ping heartbeat (type: 6) every 15 seconds
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(`{"type":6}\x1e`);
          }
        }, 15000);

        this.notifyConnectionState(true);

        if (this.activeBranchId) {
          this.joinBranch(this.activeBranchId);
        }
        if (this.activeOrderId) {
          this.joinOrder(this.activeOrderId);
        }
      };

      this.socket.onmessage = (event) => {
        const raw = event.data as string;
        if (!raw) return;

        // Split messages by record separator 0x1E
        const messages = raw.split("\x1e");
        for (const msg of messages) {
          if (!msg.trim()) continue;
          try {
            const parsed = JSON.parse(msg);

            // type 1 = Invocation from server
            if (parsed.type === 1) {
              const target = parsed.target;
              const args = parsed.arguments || [];

              if (target === "OnItemPreparationStatusChanged" && args[0]) {
                this.itemStatusCallbacks.forEach((cb) => cb(args[0]));
              } else if (
                target === "OnBatchPreparationStatusChanged" &&
                args[0]
              ) {
                this.batchStatusCallbacks.forEach((cb) => cb(args[0]));
              } else if (target === "OnOrderSyncedStatusChanged" && args[0]) {
                this.orderSyncedCallbacks.forEach((cb) => cb(args[0]));
              } else if (target === "OnNewOrderPlaced") {
                const eventData: NewOrderPlacedEvent = {
                  orderId: args[0],
                  branchId: args[1],
                  tableNumber: args[2],
                  orderType: args[3],
                };
                this.newOrderCallbacks.forEach((cb) => cb(eventData));
              }
            }
          } catch {
            // Ignore parse errors from partial frames
          }
        }
      };

      this.socket.onclose = () => {
        this.cleanupSocket();
        this.notifyConnectionState(false);
        if (this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 5000);
        }
      };

      this.socket.onerror = () => {
        this.cleanupSocket();
        this.notifyConnectionState(false);
      };
    } catch {
      this.cleanupSocket();
      this.notifyConnectionState(false);
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.cleanupSocket();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyConnectionState(false);
  }

  private cleanupSocket(): void {
    this.isConnecting = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private sendRawMessage(obj: unknown): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(`${JSON.stringify(obj)}\x1e`);
    }
  }

  public joinBranch(branchId: string): void {
    this.activeBranchId = branchId;
    this.sendRawMessage({
      type: 1,
      target: "JoinBranchGroup",
      arguments: [branchId],
    });
  }

  public leaveBranch(branchId: string): void {
    this.sendRawMessage({
      type: 1,
      target: "LeaveBranchGroup",
      arguments: [branchId],
    });
  }

  public joinOrder(orderId: string): void {
    this.activeOrderId = orderId;
    this.sendRawMessage({
      type: 1,
      target: "JoinOrderGroup",
      arguments: [orderId],
    });
  }

  public leaveOrder(orderId: string): void {
    this.sendRawMessage({
      type: 1,
      target: "LeaveOrderGroup",
      arguments: [orderId],
    });
  }

  public onItemPreparationStatusChanged(cb: ItemStatusCallback): () => void {
    this.itemStatusCallbacks.add(cb);
    return () => this.itemStatusCallbacks.delete(cb);
  }

  public onBatchPreparationStatusChanged(cb: BatchStatusCallback): () => void {
    this.batchStatusCallbacks.add(cb);
    return () => this.batchStatusCallbacks.delete(cb);
  }

  public onOrderSyncedStatusChanged(cb: OrderSyncedCallback): () => void {
    this.orderSyncedCallbacks.add(cb);
    return () => this.orderSyncedCallbacks.delete(cb);
  }

  public onNewOrderPlaced(cb: NewOrderCallback): () => void {
    this.newOrderCallbacks.add(cb);
    return () => this.newOrderCallbacks.delete(cb);
  }

  public onConnectionChanged(cb: ConnectionCallback): () => void {
    this.connectionCallbacks.add(cb);
    cb(this.isConnected());
    return () => this.connectionCallbacks.delete(cb);
  }

  private notifyConnectionState(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected));
  }

  public isConnected(): boolean {
    return Boolean(this.socket && this.socket.readyState === WebSocket.OPEN);
  }
}

export const kitchenHubService = new KitchenHubService();
