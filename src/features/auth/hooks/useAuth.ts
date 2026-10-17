import { useContext } from "react";
import { AuthContext, AuthContextType } from "../context/AuthContext";

/**
 * Hook to access authentication state and operations:
 * user, token, isAuthenticated, isLoading, isLoggingIn, login, logout, refreshMe, error.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used within an <AuthProvider>. Please wrap your application in <AuthProvider>.",
    );
  }
  return context;
}
