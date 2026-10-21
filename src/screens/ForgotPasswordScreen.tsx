import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import {
  forgotPassword as forgotPasswordApi,
  verifyPasswordResetOtp as verifyOtpApi,
  resetPassword as resetPasswordApi,
  resendVerificationCode as resendOtpApi,
} from "@/features/auth/api/authApi";
import { OtpPurpose } from "@/features/auth/types/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

type ForgotPasswordScreenRouteProp = RouteProp<
  RootStackParamList,
  "ForgotPassword"
>;

type Step = "REQUEST" | "VERIFY_OTP" | "RESET_PASSWORD" | "SUCCESS";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const route = useRoute<ForgotPasswordScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("REQUEST");
  const [email, setEmail] = useState<string>(route.params?.email || "");
  const [otpCode, setOtpCode] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null);

  // Timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send Forgot Password Request
  const handleRequestOtp = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Vui lòng nhập địa chỉ email đã đăng ký.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Địa chỉ email không đúng định dạng.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await forgotPasswordApi({ email: trimmedEmail });
      if (res.isSucceed) {
        setStep("VERIFY_OTP");
        setCountdown(60);
      } else {
        setError(res.message || "Không tìm thấy tài khoản với email này.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    try {
      setIsLoading(true);
      setError(null);
      setResendSuccessMsg(null);
      const res = await resendOtpApi({
        email: email.trim(),
        purpose: OtpPurpose.PasswordReset,
      });
      if (res.isSucceed) {
        setCountdown(60);
        setResendSuccessMsg("Mã OTP mới đã được gửi đến email của quý khách.");
      } else {
        setError(res.message || "Không thể gửi lại mã OTP lúc này.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể gửi lại mã OTP. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError(null);
    setResendSuccessMsg(null);
    const trimmedCode = otpCode.trim();
    if (!trimmedCode) {
      setError("Vui lòng nhập mã OTP gồm 6 chữ số.");
      return;
    }

    if (trimmedCode.length < 4) {
      setError("Mã OTP không hợp lệ.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await verifyOtpApi({
        email: email.trim(),
        code: trimmedCode,
      });

      if (res.isSucceed && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setStep("RESET_PASSWORD");
      } else {
        setError(res.message || "Mã OTP không chính xác hoặc đã hết hạn.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Xác thực mã OTP thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    setError(null);

    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp với mật khẩu mới.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await resetPasswordApi({
        resetToken,
        newPassword,
        confirmPassword,
      });

      if (res.isSucceed) {
        setStep("SUCCESS");
      } else {
        setError(res.message || "Đặt lại mật khẩu không thành công.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi đặt lại mật khẩu.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    if (step === "SUCCESS") return null;

    const steps = [
      { key: "REQUEST", label: "Email" },
      { key: "VERIFY_OTP", label: "Nhập OTP" },
      { key: "RESET_PASSWORD", label: "Mật khẩu" },
    ];

    const currentIdx =
      step === "REQUEST" ? 0 : step === "VERIFY_OTP" ? 1 : 2;

    return (
      <View style={styles.stepIndicatorRow}>
        {steps.map((s, idx) => {
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx;

          return (
            <React.Fragment key={s.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepBadge,
                    isActive && styles.stepBadgeActive,
                    isDone && styles.stepBadgeDone,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepBadgeText,
                        isActive && styles.stepBadgeTextActive,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isDone) && styles.stepLabelActive,
                  ]}
                >
                  {s.label}
                </Text>
              </View>

              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    isDone && styles.stepConnectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="KHÔI PHỤC MẬT KHẨU"
        showBack={navigation.canGoBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Error Banner */}
            {Boolean(error) && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Resend Success Message */}
            {Boolean(resendSuccessMsg) && (
              <View style={styles.successBanner}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={Colors.success}
                />
                <Text style={styles.successBannerText}>{resendSuccessMsg}</Text>
              </View>
            )}

            {/* STEP 1: REQUEST OTP */}
            {step === "REQUEST" && (
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="mail-unread-outline"
                    size={32}
                    color={Colors.primary}
                  />
                </View>

                <Text style={styles.cardTitle}>Quên mật khẩu?</Text>
                <Text style={styles.cardDesc}>
                  Vui lòng nhập địa chỉ email liên kết với tài khoản. Hệ thống sẽ gửi mã xác thực OTP để quý khách thiết lập mật khẩu mới.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email của quý khách</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={Colors.outline}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="email@domain.com"
                      placeholderTextColor="rgba(138, 114, 109, 0.6)"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (error) setError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    isLoading && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleRequestOtp}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.primaryBtnText}>Gửi mã xác thực</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={Colors.onPrimary}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginBtn}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === "VERIFY_OTP" && (
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={32}
                    color={Colors.secondaryGold}
                  />
                </View>

                <Text style={styles.cardTitle}>Nhập mã xác thực OTP</Text>
                <Text style={styles.cardDesc}>
                  Mã OTP bảo mật đã được gửi đến email:{"\n"}
                  <Text style={styles.highlightText}>{email}</Text>
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mã xác thực OTP (6 chữ số)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color={Colors.outline}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="Nhập mã OTP"
                      placeholderTextColor="rgba(138, 114, 109, 0.6)"
                      value={otpCode}
                      onChangeText={(t) => {
                        setOtpCode(t);
                        if (error) setError(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>
                      Gửi lại mã sau {countdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={isLoading}
                    >
                      <Text style={styles.resendText}>Gửi lại mã OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    isLoading && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.primaryBtnText}>Xác thực mã OTP</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={Colors.onPrimary}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginBtn}
                  onPress={() => setStep("REQUEST")}
                >
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.backToLoginText}>Đổi email khác</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === "RESET_PASSWORD" && (
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="lock-open-outline"
                    size={32}
                    color={Colors.primary}
                  />
                </View>

                <Text style={styles.cardTitle}>Tạo mật khẩu mới</Text>
                <Text style={styles.cardDesc}>
                  Vui lòng thiết lập mật khẩu mới có ít nhất 6 ký tự để bảo mật tài khoản hội viên của quý khách.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mật khẩu mới</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={Colors.outline}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Tối thiểu 6 ký tự"
                      placeholderTextColor="rgba(138, 114, 109, 0.6)"
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        if (error) setError(null);
                      }}
                      secureTextEntry={!showNewPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword((p) => !p)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={18}
                        color={Colors.outline}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={Colors.outline}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập lại mật khẩu mới"
                      placeholderTextColor="rgba(138, 114, 109, 0.6)"
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        if (error) setError(null);
                      }}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((p) => !p)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={18}
                        color={Colors.outline}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    isLoading && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.primaryBtnText}>Lưu mật khẩu mới</Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.onPrimary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 4: SUCCESS */}
            {step === "SUCCESS" && (
              <View style={styles.card}>
                <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={48}
                    color={Colors.success}
                  />
                </View>

                <Text style={styles.cardTitle}>Khôi phục thành công!</Text>
                <Text style={styles.cardDesc}>
                  Mật khẩu tài khoản của quý khách đã được cập nhật thành công. Quý khách có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
                </Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => navigation.navigate("Login")}
                  activeOpacity={0.85}
                >
                  <View style={styles.btnRow}>
                    <Text style={styles.primaryBtnText}>Đăng nhập ngay</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={Colors.onPrimary}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <HauteBottomBar activeTab="Account" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  stepBadgeDone: {
    backgroundColor: Colors.secondaryGold,
    borderColor: Colors.secondaryGold,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.outline,
  },
  stepBadgeTextActive: {
    color: Colors.onPrimary,
  },
  stepLabel: {
    ...Typography.labelSm,
    fontSize: 11,
    color: Colors.outline,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borderSoft,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepConnectorDone: {
    backgroundColor: Colors.secondaryGold,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    marginBottom: Spacing.md,
  },
  successBannerText: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.onSuccessContainer,
    fontWeight: "600",
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    ...Shadows.card,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(126, 37, 22, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  iconCircleSuccess: {
    backgroundColor: "rgba(46, 125, 50, 0.12)",
  },
  cardTitle: {
    ...Typography.headlineSm,
    fontSize: 20,
    color: Colors.primary,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  cardDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  highlightText: {
    fontWeight: "700",
    color: Colors.primary,
  },
  inputGroup: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    marginBottom: 6,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFBF7",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: Spacing.md,
    height: 48,
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
  otpInput: {
    letterSpacing: 4,
    fontSize: 16,
    fontWeight: "700",
  },
  resendRow: {
    alignSelf: "flex-end",
    marginBottom: Spacing.md,
    marginTop: -4,
  },
  countdownText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.outline,
  },
  resendText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
  primaryBtn: {
    width: "100%",
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
    ...Shadows.subtle,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.outline,
    elevation: 0,
    shadowOpacity: 0,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  backToLoginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: 4,
  },
  backToLoginText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "600",
  },
});
