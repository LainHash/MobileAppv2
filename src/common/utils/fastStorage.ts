import AsyncStorage from "@react-native-async-storage/async-storage";

export const fastStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[fastStorage] Failed to getItem for key: ${key}`, e);
      return null;
    }
  },

  getItemSync(_key: string): string | null {
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[fastStorage] Failed to setItem for key: ${key}`, e);
    }
  },

  setItemSync(key: string, value: string): void {
    AsyncStorage.setItem(key, value).catch((e) =>
      console.warn(`[fastStorage] Failed to setItemSync for key: ${key}`, e),
    );
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[fastStorage] Failed to removeItem for key: ${key}`, e);
    }
  },

  removeItemSync(key: string): void {
    AsyncStorage.removeItem(key).catch((e) =>
      console.warn(`[fastStorage] Failed to removeItemSync for key: ${key}`, e),
    );
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.warn(`[fastStorage] Failed to multiRemove keys`, e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn(`[fastStorage] Failed to clearAll`, e);
    }
  },

  isNativeFastStorage: false,
};

export default fastStorage;
