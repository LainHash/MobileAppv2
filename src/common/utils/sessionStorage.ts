import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_STORAGE_KEY = "@session_id";
export const LEGACY_CART_SESSION_KEY = "@cart_session_id";

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
 * Gets the current session id from AsyncStorage.
 * Falls back to legacy cart session id if available and migrates it.
 */
export async function getSessionId(): Promise<string | null> {
  try {
    const sessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionId) {
      return sessionId;
    }
    // Backward compatibility: migrate from legacy cart session key if exists
    const legacySessionId = await AsyncStorage.getItem(LEGACY_CART_SESSION_KEY);
    if (legacySessionId) {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, legacySessionId);
      return legacySessionId;
    }
    return null;
  } catch (error) {
    console.error("Failed to get session id from storage", error);
    return null;
  }
}

/**
 * Saves or removes the session id in AsyncStorage.
 */
export async function saveSessionId(sessionId: string | null): Promise<void> {
  try {
    if (sessionId) {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } else {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      await AsyncStorage.removeItem(LEGACY_CART_SESSION_KEY);
    }
  } catch (error) {
    console.error("Failed to save session id to storage", error);
  }
}

/**
 * Clears the session id from AsyncStorage.
 */
export async function clearSessionId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    await AsyncStorage.removeItem(LEGACY_CART_SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear session id from storage", error);
  }
}

/**
 * Retrieves the existing session id from AsyncStorage or generates and persists a new UUID v4.
 */
export async function getOrCreateSessionId(): Promise<string> {
  try {
    const existing = await getSessionId();
    if (existing) {
      return existing;
    }
    const newSessionId = generateUUID();
    await saveSessionId(newSessionId);
    return newSessionId;
  } catch (error) {
    console.error("Failed to get or create session id", error);
    return generateUUID();
  }
}

// Backward compatibility aliases for cart
export const CART_SESSION_KEY = SESSION_STORAGE_KEY;
export const getCartSessionId = getSessionId;
export const saveCartSessionId = saveSessionId;
export const clearCartSessionId = clearSessionId;
export const getOrCreateCartSessionId = getOrCreateSessionId;

export async function rotateSessionId(): Promise<string> {
  const newSessionId = generateUUID();
  await saveSessionId(newSessionId);
  return newSessionId;
}
