import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMMKV, MMKV } from "react-native-mmkv";

let mmkvInstance: MMKV | null = null;

try {
  if (Platform.OS !== "web") {
    mmkvInstance = createMMKV({ id: "haute-storage" });
  }
} catch (e) {
  console.warn("MMKV initialization failed, falling back to AsyncStorage", e);
}

/**
 * Ultra-fast native storage backed by C++ MMKV with seamless AsyncStorage fallback.
 * Provides microsecond read/writes for tokens, cart cache, and app settings.
 */
export const fastStorage = {
  /**
   * Retrieves string value from storage (Promise-compatible for drop-in replacement).
   */
  async getItem(key: string): Promise<string | null> {
    if (mmkvInstance) {
      return mmkvInstance.getString(key) ?? null;
    }
    return await AsyncStorage.getItem(key);
  },

  /**
   * Synchronous retrieval from C++ MMKV memory (0ms latency).
   */
  getItemSync(key: string): string | null {
    if (mmkvInstance) {
      return mmkvInstance.getString(key) ?? null;
    }
    return null;
  },

  /**
   * Persists string value into storage.
   */
  async setItem(key: string, value: string): Promise<void> {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },

  /**
   * Synchronous persist into C++ MMKV.
   */
  setItemSync(key: string, value: string): void {
    if (mmkvInstance) {
      mmkvInstance.set(key, value);
    }
  },

  /**
   * Deletes a key from storage.
   */
  async removeItem(key: string): Promise<void> {
    if (mmkvInstance) {
      mmkvInstance.remove(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },

  /**
   * Synchronous remove from C++ MMKV.
   */
  removeItemSync(key: string): void {
    if (mmkvInstance) {
      mmkvInstance.remove(key);
    }
  },

  /**
   * Deletes multiple keys in one batch.
   */
  async multiRemove(keys: string[]): Promise<void> {
    if (mmkvInstance) {
      for (const k of keys) {
        mmkvInstance.remove(k);
      }
      return;
    }
    await AsyncStorage.multiRemove(keys);
  },

  /**
   * Clears all stored keys.
   */
  async clearAll(): Promise<void> {
    if (mmkvInstance) {
      mmkvInstance.clearAll();
      return;
    }
    await AsyncStorage.clear();
  },

  isNativeFastStorage: Boolean(mmkvInstance),
};
