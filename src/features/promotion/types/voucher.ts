export type DiscountType = "Percentage" | "FixedAmount" | "FreeShipping";

export const DiscountType = {
  Percentage: "Percentage" as const,
  FixedAmount: "FixedAmount" as const,
  FreeShipping: "FreeShipping" as const,
};

export interface ValidateVoucherRequest {
  code: string;
  orderAmount: number;
  deliveryFee?: number;
  branchId?: number | string;
  channel?: number;
  orderType?: number;
  productIds?: (number | string)[];
  customerId?: number;
}

export interface ValidateVoucherResultResponse {
  isValid: boolean;
  message: string;
  discountAmount: number;
  voucherCode?: string;
  voucherName?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
}

export interface VoucherResponse {
  publicId: string;
  code: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  startAt: string;
  endAt: string;
  isPublic: boolean;
  appliesToAllBranches: boolean;
  appliesToAllProducts: boolean;
  status: string;
}

export interface CustomerVoucherResponse {
  publicId: string;
  voucherCode: string;
  voucherName: string;
  description?: string | null;
  imageUrl?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  expiresAt: string;
  status: string;
  claimedAt: string;
  usedAt?: string | null;
}
