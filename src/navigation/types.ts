export type RootStackParamList = {
  Home: undefined;
  Menu:
    | {
        categoryId?: string | null;
        brandId?: string | null;
        branchId?: string | null;
      }
    | undefined;
};

