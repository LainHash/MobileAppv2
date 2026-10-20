export enum TableStatus {
  Available = "Available",
  Occupied = "Occupied",
  Reserved = "Reserved",
  Maintenance = "Maintenance",
  Inactive = "Inactive",
}

export enum TableShape {
  Round = "Round",
  Square = "Square",
  Rectangle = "Rectangle",
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  shape: TableShape;
  status: TableStatus;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
}
