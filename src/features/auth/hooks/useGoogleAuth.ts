import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useAuth } from "./useAuth";
import { User } from "../types/auth";

// Ensure web browser auth sessions finish properly
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export interface UseGoogleAuthResult {
  isAuthenticating: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; user?: User }>;
}

export function useGoogleAuth(
  onSuccess?: (user?: User) => void,
  onError?: (error: string) => void,
): UseGoogleAuthResult {
  const { loginWithGoogle, isLoggingIn } = useAuth();
  const [isPrompting, setIsPrompting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const googleClientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "mobileappv2",
    path: "redirect",
  });

  const [, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
    },
    GOOGLE_DISCOVERY,
  );

  // Handle the OAuth response from Google
  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        const err = "Không nhận được mã xác thực (id_token) từ Google.";
        setAuthError(err);
        onError?.(err);
        setIsPrompting(false);
        return;
      }

      loginWithGoogle(idToken).then((res) => {
        setIsPrompting(false);
        if (res.success) {
          setAuthError(null);
          onSuccess?.(res.user);
        } else {
          const err = res.error || "Đăng nhập Google thất bại.";
          setAuthError(err);
          onError?.(err);
        }
      });
    } else if (response.type === "error") {
      setIsPrompting(false);
      const err = response.error?.message || "Đăng nhập Google bị hủy hoặc gặp lỗi.";
      setAuthError(err);
      onError?.(err);
    } else if (response.type === "cancel" || response.type === "dismiss") {
      setIsPrompting(false);
    }
  }, [response, loginWithGoogle, onSuccess, onError]);

  const signInWithGoogle = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
    user?: User;
  }> => {
    setAuthError(null);

    // If client ID hasn't been set up yet, provide a clear, helpful dialog
    if (
      !process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID")
    ) {
      const msg =
        "Tính năng Đăng nhập Google đã sẵn sàng trên cả Mobile & Backend. Vui lòng cấu hình EXPO_PUBLIC_GOOGLE_CLIENT_ID trong file .env để kết nối Google Cloud của nhà hàng.";
      Alert.alert(
        "Google Sign-In",
        msg,
        [
          { text: "Đã hiểu", style: "default" },
        ],
      );
      return { success: false, error: msg };
    }

    try {
      setIsPrompting(true);
      const promptResult = await promptAsync();
      if (promptResult.type === "cancel" || promptResult.type === "dismiss") {
        setIsPrompting(false);
        return { success: false, error: "Đã hủy đăng nhập Google." };
      }
      return { success: true };
    } catch (err: any) {
      setIsPrompting(false);
      const errMsg =
        err?.message || "Không thể khởi động trình xác thực Google.";
      setAuthError(errMsg);
      onError?.(errMsg);
      return { success: false, error: errMsg };
    }
  }, [promptAsync, onError]);

  return {
    isAuthenticating: isPrompting || isLoggingIn,
    error: authError,
    signInWithGoogle,
  };
}
