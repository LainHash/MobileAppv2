import AsyncStorage from "@react-native-async-storage/async-storage";

export const BRANCH_STORAGE_KEY = "@selected_branch_id";

export async function saveSelectedBranchId(
  branchId: string | null,
): Promise<void> {
  try {
    if (branchId) {
      await AsyncStorage.setItem(BRANCH_STORAGE_KEY, branchId);
    } else {
      await AsyncStorage.removeItem(BRANCH_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to save branch id to storage", error);
  }
}

export async function getSelectedBranchId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BRANCH_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to get branch id from storage", error);
    return null;
  }
}

export async function clearSelectedBranchId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BRANCH_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear branch id from storage", error);
  }
}
