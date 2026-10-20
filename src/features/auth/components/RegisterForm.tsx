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
import { Ionicons } from "@expo/vector-icons";
import { register as registerApi } from "../api/authApi";
import { savePendingRegisterEmail } from "../utils/authStorage";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface RegisterFormProps {
  onSuccess?: (email: string) => void;
  onLoginPress?: () => void;
  title?: string;
  subtitle?: string;
}

export function RegisterForm({
  onSuccess,
  onLoginPress,
  title = "Tạo tài khoản mới",
  subtitle = "Bước 1/3: Điền thông tin đăng ký tài khoản của bạn",
}: RegisterFormProps) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userNameError, setUserNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setUserNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setServerError(null);

    const trimmedUser = userName.trim();
    if (!trimmedUser) {
      setUserNameError("Vui lòng nhập tên đăng nhập");
      isValid = false;
    } else if (trimmedUser.length < 3) {
      setUserNameError("Tên đăng nhập phải có ít nhất 3 ký tự");
      isValid = false;
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setEmailError("Vui lòng nhập địa chỉ email");
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Địa chỉ email không đúng định dạng");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    const trimmedEmail = email.trim();
    const payload = {
      userName: userName.trim(),
      email: trimmedEmail,
      password,
      confirmPassword,
    };

    try {
      await savePendingRegisterEmail(trimmedEmail);

      const res = await registerApi(payload);

      if (res.isSucceed) {
        onSuccess?.(trimmedEmail);
      } else {
        const msg = res.message || "Đăng ký không thành công. Vui lòng thử lại.";
        setServerError(msg);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Server Error Banner */}
        {Boolean(serverError) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        )}

        {/* Username Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Tên đăng nhập <Text style={styles.requiredMark}>*</Text>
          </Text>
          <View
            style={[
              styles.inputContainer,
              Boolean(userNameError) && styles.inputError,
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
              placeholder="Ví dụ: nguyenvana"
              placeholderTextColor="rgba(138, 114, 109, 0.6)"
              value={userName}
              onChangeText={(text) => {
                setUserName(text);
                if (userNameError) setUserNameError(null);
                if (serverError) setServerError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />
          </View>
          {Boolean(userNameError) && (
            <Text style={styles.errorText}>{userNameError}</Text>
          )}
        </View>

        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Địa chỉ Email <Text style={styles.requiredMark}>*</Text>
          </Text>
          <View
            style={[
              styles.inputContainer,
              Boolean(emailError) && styles.inputError,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={Colors.outline}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: example@gmail.com"
              placeholderTextColor="rgba(138, 114, 109, 0.6)"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(null);
                if (serverError) setServerError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />
          </View>
          {Boolean(emailError) && (
            <Text style={styles.errorText}>{emailError}</Text>
          )}
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Mật khẩu <Text style={styles.requiredMark}>*</Text>
          </Text>
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
              placeholder="Tối thiểu 6 ký tự..."
              placeholderTextColor="rgba(138, 114, 109, 0.6)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
                if (serverError) setServerError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isSubmitting}
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

        {/* Confirm Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Xác nhận mật khẩu <Text style={styles.requiredMark}>*</Text>
          </Text>
          <View
            style={[
              styles.inputContainer,
              Boolean(confirmPasswordError) && styles.inputError,
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={Colors.outline}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu..."
              placeholderTextColor="rgba(138, 114, 109, 0.6)"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError(null);
                if (serverError) setServerError(null);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={Colors.outline}
              />
            </TouchableOpacity>
          </View>
          {Boolean(confirmPasswordError) && (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleRegister}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.onPrimary} size="small" />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.submitButtonText}>Tiếp tục xác thực OTP</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.onPrimary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Login footer link */}
        {onLoginPress && (
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={onLoginPress} disabled={isSubmitting}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    ...Shadows.subtle,
  },
  header: {
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  title: {
    ...Typography.headlineSm,
    fontSize: 20,
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.3)",
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: "600",
    marginBottom: 6,
  },
  requiredMark: {
    color: Colors.primaryContainer,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "rgba(186, 26, 26, 0.04)",
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
    ...Typography.labelSm,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
  submitButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.outlineVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitButtonText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  footerText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  loginLink: {
    ...Typography.labelMd,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
});
