import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { User } from "../types/auth";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface LoginFormProps {
  onSuccess?: (user?: User) => void;
  onError?: (errorMessage: string) => void;
  onForgotPasswordPress?: () => void;
  onRegisterPress?: () => void;
  defaultIdentifier?: string;
  title?: string;
  subtitle?: string;
}

export function LoginForm({
  onSuccess,
  onError,
  onForgotPasswordPress,
  onRegisterPress,
  defaultIdentifier = "",
}: LoginFormProps) {
  const { login, isLoggingIn, error, clearError } = useAuth();
  const { isAuthenticating: isGoogleAuthenticating, signInWithGoogle } =
    useGoogleAuth(onSuccess, onError);

  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validate = (): boolean => {
    let isValid = true;
    setIdentifierError(null);
    setPasswordError(null);

    if (!identifier.trim()) {
      setIdentifierError("Vui lòng nhập số điện thoại hoặc email");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu của quý khách");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;

    const res = await login({
      identifier: identifier.trim(),
      password,
    });

    if (res.success) {
      onSuccess?.(res.user);
    } else {
      onError?.(res.error || "Đăng nhập không thành công");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Global Error Banner */}
        {Boolean(error) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Identifier Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số điện thoại hoặc Email</Text>
          <View
            style={[
              styles.inputContainer,
              Boolean(identifierError) && styles.inputError,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={Colors.outline}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="0912 345 678 hoặc email@domain.vn"
              placeholderTextColor="rgba(138, 114, 109, 0.6)"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (identifierError) setIdentifierError(null);
                if (error) clearError();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
            />
          </View>
          {Boolean(identifierError) && (
            <Text style={styles.errorText}>{identifierError}</Text>
          )}
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View
            style={[
              styles.inputContainer,
              Boolean(passwordError) && styles.inputError,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={Colors.outline}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu của quý khách"
              placeholderTextColor="rgba(138, 114, 109, 0.6)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
                if (error) clearError();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoggingIn}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={Colors.outline}
              />
            </TouchableOpacity>
          </View>
          {Boolean(passwordError) && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}
        </View>

        {/* Options Row: Remember Me & Forgot Password */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkboxBox,
                rememberMe && styles.checkboxBoxActive,
              ]}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
          </TouchableOpacity>

          {onForgotPasswordPress && (
            <TouchableOpacity
              onPress={onForgotPasswordPress}
              disabled={isLoggingIn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Primary Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoggingIn && styles.submitButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoggingIn}
          activeOpacity={0.85}
        >
          {isLoggingIn ? (
            <ActivityIndicator color={Colors.onPrimary} size="small" />
          ) : (
            <View style={styles.btnContent}>
              <Text style={styles.submitButtonText}>Đăng nhập ngay</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={Colors.onPrimary}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>HOẶC TIẾP TỤC VỚI</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Fast Login */}
        <View style={styles.socialRow}>
          {/* <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
            <Ionicons name="logo-apple" size={18} color={Colors.onSurface} />
            <Text style={styles.socialBtnText}>Apple</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[
              styles.socialBtn,
              isGoogleAuthenticating && styles.socialBtnDisabled,
            ]}
            activeOpacity={0.75}
            onPress={signInWithGoogle}
            disabled={isLoggingIn || isGoogleAuthenticating}
          >
            {isGoogleAuthenticating ? (
              <ActivityIndicator size="small" color="#EA4335" />
            ) : (
              <>
                <Ionicons name="logo-google" size={16} color="#EA4335" />
                <Text style={styles.socialBtnText}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
            <Ionicons name="chatbubble-ellipses" size={17} color="#0068FF" />
            <Text style={styles.socialBtnText}>Zalo</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Register footer link */}
      {onRegisterPress && (
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={onRegisterPress} disabled={isLoggingIn}>
            <Text style={styles.registerLink}>Đăng ký thành viên ngay</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFBF7",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "#FFF5F5",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    height: "100%",
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDFBF7",
  },
  checkboxBoxActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  checkboxLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  forgotPasswordText: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.full,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.outline,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitButtonText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  dividerText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.6,
  },
  socialRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: "#FDFBF7",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  socialBtnDisabled: {
    opacity: 0.6,
  },
  socialBtnText: {
    ...Typography.labelSm,
    fontSize: 12,
    color: Colors.onSurface,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  footerText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  registerLink: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default LoginForm;
