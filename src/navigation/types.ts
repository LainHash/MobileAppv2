import { Product } from "@/features/catalog/products";

export type RootStackParamList = {
  Home: undefined;
  Menu:
    | {
        categoryId?: string | null;
        brandId?: string | null;
        branchId?: string | null;
      }
    | undefined;
  ProductDetail: {
    productId: string;
    product?: Product;
    branchId?: string | null;
  };
  Cart:
    | {
        branchId?: string | null;
      }
    | undefined;
  Wishlist:
    | {
        branchId?: string | null;
      }
    | undefined;
  Login:
    | {
        identifier?: string;
      }
    | undefined;
  Register: undefined;
  ForgotPassword:
    | {
        email?: string;
      }
    | undefined;
  VerifyEmail:
    | {
        email?: string;
      }
    | undefined;
  CompleteProfile:
    | {
        email?: string;
      }
    | undefined;
  Profile: undefined;
  EditProfile: undefined;
  Contact:
    | {
        branchId?: string | null;
      }
    | undefined;
  Checkout:
    | {
        branchId?: string | null;
      }
    | undefined;
  OrderSuccess: {
    orderId: string;
    orderCode?: string;
    payment?: any;
    totalAmount?: number;
  };
  Orders:
    | {
        branchId?: string | null;
      }
    | undefined;
  OrderDetail: {
    orderId: string;
  };
  Reservation:
    | {
        branchId?: string | null;
      }
    | undefined;
  ReservationSuccess: {
    reservationId: string;
    reservationCode: string;
    branchName: string;
    partySize: number;
    reservedFrom: string;
  };
  MyReservations: undefined;
  ReservationDetail: {
    reservationId: string;
  };
};

