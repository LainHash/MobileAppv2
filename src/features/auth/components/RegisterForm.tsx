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
import { register as registerApi } from "../api/authApi";
import { savePendingRegisterEmail } from "../utils/authStorage";

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
      // Save email into local storage right before/during API call
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
            <Text style={styles.errorBannerIcon}>⚠️</Text>
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
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: nguyenvana"
              placeholderTextColor="#94A3B8"
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
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: example@gmail.com"
              placeholderTextColor="#94A3B8"
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
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Tối thiểu 6 ký tự..."
              placeholderTextColor="#94A3B8"
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
              <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
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
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu..."
              placeholderTextColor="#94A3B8"
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
              <Text style={styles.eyeIcon}>
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </Text>
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
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Tiếp tục xác thực OTP</Text>
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 12,
    marginBottom: 16,
  },
  errorBannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  requiredMark: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    height: "100%",
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 2,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#93C5FD",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#64748B",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
});
