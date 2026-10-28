import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  LoginRequest,
  UpdatePersonalProfileRequest,
  ChangePasswordRequest,
  SavedAccount,
} from "../types/auth";
import {
  Login as loginApi,
  loginWithGoogle as googleLoginApi,
  getMe as getMeApi,
  logout as logoutApi,
  refreshToken as refreshApi,
  updatePersonalProfile as updateProfileApi,
  changePassword as changePasswordApi,
} from "../api/authApi";
import {
  getAuthToken,
  getRefreshToken,
  saveAuthTokens,
  clearAuthStorage,
  getCachedUser,
  saveCachedUser,
  getSavedAccounts,
  addOrUpdateSavedAccount,
  removeSavedAccount,
} from "../utils/authStorage";
import { clearSessionId, rotateSessionId } from "@/common/utils/sessionStorage";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  error: string | null;
  savedAccounts: SavedAccount[];
  login: (
    data: LoginRequest,
  ) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    hasPersonalProfile?: boolean;
  }>;
  loginWithGoogle: (
    idToken: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    hasPersonalProfile?: boolean;
  }>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<string | null>;
  refreshMe: () => Promise<User | null>;
  updateProfile: (
    data: UpdatePersonalProfileRequest,
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    data: ChangePasswordRequest,
  ) => Promise<{ success: boolean; error?: string }>;
  loadSavedAccounts: () => Promise<SavedAccount[]>;
  removeAccount: (idOrUserName: string) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  const loadSavedAccounts = useCallback(async (): Promise<SavedAccount[]> => {
    try {
      const accounts = await getSavedAccounts();
      setSavedAccounts(accounts);
      return accounts;
    } catch {
      return [];
    }
  }, []);

  const recordUserAccount = useCallback(async (u: User) => {
    const fullName = u.personalProfile
      ? `${u.personalProfile.lastName} ${u.personalProfile.firstName}`.trim()
      : u.userName;
    await addOrUpdateSavedAccount({
      id: u.id,
      userName: u.userName,
      email: u.email,
      fullName,
      roleName: u.roleName,
    });
    const updated = await getSavedAccounts();
    setSavedAccounts(updated);
  }, []);

  const removeAccount = useCallback(async (idOrUserName: string) => {
    await removeSavedAccount(idOrUserName);
    const updated = await getSavedAccounts();
    setSavedAccounts(updated);
  }, []);

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
      await loadSavedAccounts();
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
            // If user has not completed personal profile, treat as logged out per requirements
            if (!res.data.personalProfile) {
              await clearAuthStorage();
              setToken(null);
              setUser(null);
              return;
            }
            setUser(res.data);
            await saveCachedUser(res.data);
            await recordUserAccount(res.data);
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
                  await recordUserAccount(retryRes.data);
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
  }, [refreshTokens, loadSavedAccounts, recordUserAccount]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        setIsLoggingIn(true);
        setError(null);

        const res = await loginApi(data);
        const authToken = res?.data?.token;
        const refreshToken = res?.data?.refreshToken;
        const serverHasProfile = res?.data?.hasPersonalProfile;

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
            await recordUserAccount(profileRes.data);
            const userHasProfile =
              serverHasProfile !== undefined
                ? serverHasProfile
                : Boolean(profileRes.data.personalProfile);
            return {
              success: true,
              user: profileRes.data,
              hasPersonalProfile: userHasProfile,
            };
          }
        } catch (profileErr: any) {
          console.warn("Could not fetch user profile after login", profileErr);
        }

        return {
          success: true,
          hasPersonalProfile: serverHasProfile,
        };
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
    },
    [recordUserAccount],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      try {
        setIsLoggingIn(true);
        setError(null);

        const res = await googleLoginApi(idToken);
        const authToken = res?.data?.token;
        const refreshToken = res?.data?.refreshToken;
        const serverHasProfile = res?.data?.hasPersonalProfile;

        if (!authToken) {
          const errMsg =
            res?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.";
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
            await recordUserAccount(profileRes.data);
            const userHasProfile =
              serverHasProfile !== undefined
                ? serverHasProfile
                : Boolean(profileRes.data.personalProfile);
            return {
              success: true,
              user: profileRes.data,
              hasPersonalProfile: userHasProfile,
            };
          }
        } catch (profileErr: any) {
          console.warn(
            "Could not fetch user profile after Google login",
            profileErr,
          );
        }

        return {
          success: true,
          hasPersonalProfile: serverHasProfile,
        };
      } catch (err: any) {
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Đăng nhập bằng Google thất bại. Vui lòng thử lại.";
        setError(errMsg);
        return { success: false, error: errMsg };
      } finally {
        setIsLoggingIn(false);
      }
    },
    [recordUserAccount],
  );

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
      await clearSessionId();
      await rotateSessionId();
      setToken(null);
      setUser(null);
      setError(null);
      await loadSavedAccounts();
    }
  }, [token, loadSavedAccounts]);

  const refreshMe = useCallback(async (): Promise<User | null> => {
    const currentToken = token || (await getAuthToken());
    if (!currentToken) return null;

    try {
      const res = await getMeApi(currentToken);
      if (res?.data) {
        setUser(res.data);
        await saveCachedUser(res.data);
        await recordUserAccount(res.data);
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
              await recordUserAccount(retryRes.data);
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
  }, [token, logout, refreshTokens, recordUserAccount]);

  const updateProfile = useCallback(
    async (
      data: UpdatePersonalProfileRequest,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const currentToken = token || (await getAuthToken());
        const res = await updateProfileApi(data, currentToken);
        if (res.isSucceed) {
          await refreshMe();
          return { success: true };
        }
        return {
          success: false,
          error: res.message || "Cập nhật thông tin thất bại.",
        };
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Cập nhật thông tin thất bại. Vui lòng thử lại.";
        return { success: false, error: msg };
      }
    },
    [token, refreshMe],
  );

  const changePassword = useCallback(
    async (
      data: ChangePasswordRequest,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const currentToken = token || (await getAuthToken());
        const res = await changePasswordApi(data, currentToken);
        if (res.isSucceed) {
          return { success: true };
        }
        return {
          success: false,
          error: res.message || "Đổi mật khẩu thất bại.",
        };
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Đổi mật khẩu thất bại. Vui lòng thử lại.";
        return { success: false, error: msg };
      }
    },
    [token],
  );

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
    savedAccounts,
    login,
    loginWithGoogle,
    logout,
    refreshTokens,
    refreshMe,
    updateProfile,
    changePassword,
    loadSavedAccounts,
    removeAccount,
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
