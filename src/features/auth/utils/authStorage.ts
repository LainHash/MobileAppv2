import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/auth";

export const AUTH_TOKEN_KEY = "@auth_token";
export const AUTH_REFRESH_TOKEN_KEY = "@auth_refresh_token";
export const AUTH_USER_KEY = "@auth_user";

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
