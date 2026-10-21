import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, SavedAccount } from "../types/auth";

export const AUTH_TOKEN_KEY = "@auth_token";
export const AUTH_REFRESH_TOKEN_KEY = "@auth_refresh_token";
export const AUTH_USER_KEY = "@auth_user";
export const AUTH_SAVED_ACCOUNTS_KEY = "@auth_saved_accounts";

/**
 * Gets the stored JWT access token.
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get auth token from storage", error);
    return null;
  }
}

/**
 * Gets the stored refresh token.
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get refresh token from storage", error);
    return null;
  }
}

/**
 * Persists both access token and refresh token into AsyncStorage.
 */
export async function saveAuthTokens(
  token: string | null,
  refreshToken?: string | null,
): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }

    if (refreshToken) {
      await AsyncStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    } else if (refreshToken === null) {
      await AsyncStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Failed to save auth tokens to storage", error);
  }
}

/**
 * Clears all authentication tokens and cached user data from storage.
 */
export async function clearAuthStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      AUTH_REFRESH_TOKEN_KEY,
      AUTH_USER_KEY,
    ]);
  } catch (error) {
    console.error("Failed to clear auth storage", error);
  }
}

/**
 * Gets the cached User profile from AsyncStorage.
 */
export async function getCachedUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (error) {
    console.error("Failed to parse cached user from storage", error);
    return null;
  }
}

/**
 * Saves or clears the cached User profile.
 */
export async function saveCachedUser(user: User | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (error) {
    console.error("Failed to save cached user to storage", error);
  }
}

export const AUTH_PENDING_REGISTER_EMAIL_KEY = "@auth_pending_register_email";

/**
 * Gets the stored pending register email.
 */
export async function getPendingRegisterEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_PENDING_REGISTER_EMAIL_KEY);
  } catch (error) {
    console.error("Failed to get pending register email from storage", error);
    return null;
  }
}

/**
 * Persists the pending register email into AsyncStorage.
 */
export async function savePendingRegisterEmail(
  email: string | null,
): Promise<void> {
  try {
    if (email) {
      await AsyncStorage.setItem(AUTH_PENDING_REGISTER_EMAIL_KEY, email.trim());
    } else {
      await AsyncStorage.removeItem(AUTH_PENDING_REGISTER_EMAIL_KEY);
    }
  } catch (error) {
    console.error("Failed to save pending register email to storage", error);
  }
}

/**
 * Clears the pending register email from AsyncStorage.
 */
export async function clearPendingRegisterEmail(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_PENDING_REGISTER_EMAIL_KEY);
  } catch (error) {
    console.error("Failed to clear pending register email from storage", error);
  }
}

/**
 * Gets the list of saved accounts on this device.
 */
export async function getSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedAccount[];
  } catch (error) {
    console.error("Failed to get saved accounts from storage", error);
    return [];
  }
}

/**
 * Adds or updates an account in the saved accounts list.
 */
export async function addOrUpdateSavedAccount(
  account: SavedAccount,
): Promise<void> {
  try {
    const existing = await getSavedAccounts();
    const filtered = existing.filter(
      (a) => a.id !== account.id && a.userName.toLowerCase() !== account.userName.toLowerCase(),
    );
    const updated = [
      {
        ...account,
        lastActiveAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, 5); // Keep up to 5 recently used accounts

    await AsyncStorage.setItem(
      AUTH_SAVED_ACCOUNTS_KEY,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error("Failed to add or update saved account", error);
  }
}

/**
 * Removes an account from the saved accounts list by ID or userName.
 */
export async function removeSavedAccount(idOrUserName: string): Promise<void> {
  try {
    const existing = await getSavedAccounts();
    const updated = existing.filter(
      (a) =>
        a.id !== idOrUserName &&
        a.userName.toLowerCase() !== idOrUserName.toLowerCase(),
    );
    await AsyncStorage.setItem(
      AUTH_SAVED_ACCOUNTS_KEY,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error("Failed to remove saved account", error);
  }
}

