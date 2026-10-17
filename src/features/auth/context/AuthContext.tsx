import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, LoginRequest } from "../types/auth";
import {
  Login as loginApi,
  getMe as getMeApi,
  logout as logoutApi,
  refreshToken as refreshApi,
} from "../api/authApi";
import {
  getAuthToken,
  getRefreshToken,
  saveAuthTokens,
  clearAuthStorage,
  getCachedUser,
  saveCachedUser,
} from "../utils/authStorage";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  error: string | null;
  login: (
    data: LoginRequest,
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<string | null>;
  refreshMe: () => Promise<User | null>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    try {
      const storedRefreshToken = await getRefreshToken();
      if (!storedRefreshToken) {
        return null;
      }
      const res = await refreshApi(storedRefreshToken);
      const newAccessToken = res?.data?.token;
      const newRefreshToken = res?.data?.refreshToken;
      if (newAccessToken) {
        await saveAuthTokens(newAccessToken, newRefreshToken);
        setToken(newAccessToken);
        return newAccessToken;
      }
      return null;
    } catch (err) {
      console.warn("Failed to refresh token", err);
      return null;
    }
  }, []);

  // Initialize auth state from AsyncStorage on app launch
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await getAuthToken();
      const cachedUser = await getCachedUser();

      if (storedToken) {
        setToken(storedToken);
        if (cachedUser) {
          setUser(cachedUser);
        }

        // Validate and sync latest profile from backend
        try {
          const res = await getMeApi(storedToken);
          if (res?.data) {
            setUser(res.data);
            await saveCachedUser(res.data);
          }
        } catch (apiErr: any) {
          // If token has expired or is unauthorized, attempt refresh
          if (apiErr?.response?.status === 401) {
            const newToken = await refreshTokens();
            if (newToken) {
              try {
                const retryRes = await getMeApi(newToken);
                if (retryRes?.data) {
                  setUser(retryRes.data);
                  await saveCachedUser(retryRes.data);
                  return;
                }
              } catch {
                // fall through to clear
              }
            }
            await clearAuthStorage();
            setToken(null);
            setUser(null);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to initialize authentication", err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTokens]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      setIsLoggingIn(true);
      setError(null);

      const res = await loginApi(data);
      const authToken = res?.data?.token;
      const refreshToken = res?.data?.refreshToken;

      if (!authToken) {
        const errMsg =
          res?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      await saveAuthTokens(authToken, refreshToken);
      setToken(authToken);

      // Fetch user profile
      try {
        const profileRes = await getMeApi(authToken);
        if (profileRes?.data) {
          setUser(profileRes.data);
          await saveCachedUser(profileRes.data);
          return { success: true, user: profileRes.data };
        }
      } catch (profileErr: any) {
        console.warn("Could not fetch user profile after login", profileErr);
      }

      return { success: true };
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const storedRefreshToken = await getRefreshToken();
      const currentToken = token || (await getAuthToken());
      if (storedRefreshToken) {
        try {
          await logoutApi(storedRefreshToken, currentToken);
        } catch (apiErr) {
          console.warn("Backend logout failed or token already invalid", apiErr);
        }
      }
    } catch (err) {
      console.error("Failed to logout", err);
    } finally {
      await clearAuthStorage();
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, [token]);

  const refreshMe = useCallback(async (): Promise<User | null> => {
    const currentToken = token || (await getAuthToken());
    if (!currentToken) return null;

    try {
      const res = await getMeApi(currentToken);
      if (res?.data) {
        setUser(res.data);
        await saveCachedUser(res.data);
        return res.data;
      }
      return null;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        const newToken = await refreshTokens();
        if (newToken) {
          try {
            const retryRes = await getMeApi(newToken);
            if (retryRes?.data) {
              setUser(retryRes.data);
              await saveCachedUser(retryRes.data);
              return retryRes.data;
            }
          } catch {
            await logout();
          }
        } else {
          await logout();
        }
      }
      return null;
    }
  }, [token, logout, refreshTokens]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    isLoggingIn,
    error,
    login,
    logout,
    refreshTokens,
    refreshMe,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
