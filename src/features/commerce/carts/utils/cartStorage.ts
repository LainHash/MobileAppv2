import AsyncStorage from "@react-native-async-storage/async-storage";

export const CART_SESSION_KEY = "@cart_session_id";

/**
 * Generates an RFC4122 version 4 UUID compliant string.
 */
export function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if environment crypto.randomUUID fails
    }
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the current cart session id from AsyncStorage.
 */
export async function getCartSessionId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CART_SESSION_KEY);
  } catch (error) {
    console.error("Failed to get cart session id from storage", error);
    return null;
  }
}

/**
 * Saves or removes the cart session id in AsyncStorage.
 */
export async function saveCartSessionId(
  sessionId: string | null,
): Promise<void> {
  try {
    if (sessionId) {
      await AsyncStorage.setItem(CART_SESSION_KEY, sessionId);
    } else {
      await AsyncStorage.removeItem(CART_SESSION_KEY);
    }
  } catch (error) {
    console.error("Failed to save cart session id to storage", error);
  }
}

/**
 * Clears the cart session id from AsyncStorage.
 */
export async function clearCartSessionId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CART_SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear cart session id from storage", error);
  }
}

/**
 * Retrieves the existing session id from AsyncStorage or generates and persists a new UUID v4.
 */
export async function getOrCreateCartSessionId(): Promise<string> {
  try {
    const existing = await getCartSessionId();
    if (existing) {
      return existing;
    }
    const newSessionId = generateUUID();
    await saveCartSessionId(newSessionId);
    return newSessionId;
  } catch (error) {
    console.error("Failed to get or create cart session id", error);
    return generateUUID();
  }
}
