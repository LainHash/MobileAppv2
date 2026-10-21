export interface Branch {
  id: string;
  city: string;
  branchCode: string;
  phoneNumber: string;
  email: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  status: string;
  openTime: string;
  closeTime: string;
}

export interface NearbyBranchItem {
  branch: Branch;
  distanceKm: number;
  distanceMeters: number;
  estimatedDeliveryMinutes: number;
  estimatedDeliveryFee: number;
  isOpenNow: boolean;
  isDeliverable: boolean;
}

export interface OptimalBranchResponse {
  branch: Branch;
  distanceKm: number;
  distanceMeters: number;
  estimatedDeliveryMinutes: number;
  estimatedDeliveryFee: number;
  isOpenNow: boolean;
  isDeliverable: boolean;
  nearbyBranches: NearbyBranchItem[];
}

