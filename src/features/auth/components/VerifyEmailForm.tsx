import React, { useState, useEffect, useRef } from "react";
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
import { verifyEmail as verifyEmailApi, resendVerificationCode } from "../api/authApi";
import { getPendingRegisterEmail, savePendingRegisterEmail } from "../utils/authStorage";
import { OtpPurpose } from "../types/auth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface VerifyEmailFormProps {
  initialEmail?: string;
  onSuccess?: (email: string) => void;
  onRestartRegister?: () => void;
  title?: string;
  subtitle?: string;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export function VerifyEmailForm({
  initialEmail,
  onSuccess,
  onRestartRegister,
  title = "Xác thực địa chỉ Email",
  subtitle = "Bước 2/3: Nhập mã OTP 6 chữ số vừa được gửi đến email",
}: VerifyEmailFormProps) {
  const [email, setEmail] = useState<string>(initialEmail || "");
  const [isEmailLoading, setIsEmailLoading] = useState(!initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  const inputRef = useRef<TextInput>(null);

  // Load pending email from AsyncStorage if not supplied in props
  useEffect(() => {
    let isMounted = true;
    const fetchEmail = async () => {
      try {
        if (!initialEmail) {
          const storedEmail = await getPendingRegisterEmail();
          if (isMounted && storedEmail) {
            setEmail(storedEmail);
          }
        } else {
          await savePendingRegisterEmail(initialEmail);
        }
      } catch (e) {
        console.error("Failed to load pending register email", e);
      } finally {
        if (isMounted) {
          setIsEmailLoading(false);
        }
      }
    };

    fetchEmail();
    return () => {
      isMounted = false;
    };
  }, [initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    setServerError(null);
    setSuccessNotice(null);

    if (code.length !== OTP_LENGTH) {
      setServerError(`Vui lòng nhập đủ ${OTP_LENGTH} chữ số OTP`);
      return;
    }

    setIsVerifying(true);
    try {
      let targetEmail = email;
      if (!targetEmail) {
        targetEmail = (await getPendingRegisterEmail()) || "";
      }

      const res = await verifyEmailApi({
        email: targetEmail,
        code,
      });

      if (res.isSucceed) {
        setSuccessNotice("Xác thực email thành công! Đang chuyển tiếp...");
        onSuccess?.(targetEmail);
      } else {
        const msg =
          res.message ||
          "Mã OTP không chính xác hoặc đã hết hiệu lực. Vui lòng kiểm tra lại.";
        setServerError(msg);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Xác thực thất bại. Vui lòng thử lại.";
      setServerError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setServerError(null);
    setSuccessNotice(null);

    try {
      let targetEmail = email;
      if (!targetEmail) {
        targetEmail = (await getPendingRegisterEmail()) || "";
      }

      const res = await resendVerificationCode({
        email: targetEmail,
        purpose: OtpPurpose.EmailVerification,
      });

      if (res.isSucceed) {
        setSuccessNotice("Mã OTP mới đã được gửi tới email của bạn.");
        setCountdown(RESEND_COOLDOWN);
        setOtpCode("");
      } else {
        setServerError(res.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gửi lại mã OTP thất bại.";
      setServerError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    setOtpCode(cleaned);
    if (serverError) setServerError(null);

    if (cleaned.length === OTP_LENGTH) {
      handleVerify(cleaned);
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

        {/* Email Highlight Box */}
        <View style={styles.emailBadge}>
          <View style={styles.emailBadgeIconWrap}>
            <Ionicons name="mail" size={18} color={Colors.primaryContainer} />
          </View>
          <View style={styles.emailBadgeContent}>
            <Text style={styles.emailBadgeLabel}>Mã xác thực gửi tới:</Text>
            {isEmailLoading ? (
              <ActivityIndicator size="small" color={Colors.primaryContainer} />
            ) : (
              <Text style={styles.emailBadgeAddress} numberOfLines={1}>
                {email || "(Chưa xác định email)"}
              </Text>
            )}
          </View>
        </View>

        {/* Error Banner */}
        {Boolean(serverError) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        )}

        {/* Success Notice Banner */}
        {Boolean(successNotice) && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.successBannerText}>{successNotice}</Text>
          </View>
        )}

        {/* 6-cell Visual OTP Boxes */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
          style={styles.otpBoxesRow}
        >
          {Array.from({ length: OTP_LENGTH }).map((_, index) => {
            const digit = otpCode[index] || "";
            const isCurrent = index === otpCode.length;
            const isFilled = Boolean(digit);

            return (
              <View
                key={index}
                style={[
                  styles.otpCell,
                  isCurrent && styles.otpCellActive,
                  isFilled && styles.otpCellFilled,
                  Boolean(serverError) && styles.otpCellError,
                ]}
              >
                <Text style={styles.otpCellText}>{digit}</Text>
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Hidden underlying TextInput for native keyboard handling */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={otpCode}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus={true}
          caretHidden={true}
          editable={!isVerifying}
        />

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (otpCode.length !== OTP_LENGTH || isVerifying) &&
              styles.submitButtonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={otpCode.length !== OTP_LENGTH || isVerifying}
          activeOpacity={0.85}
        >
          {isVerifying ? (
            <ActivityIndicator color={Colors.onPrimary} size="small" />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.submitButtonText}>Xác thực OTP</Text>
              <Ionicons name="shield-checkmark" size={16} color={Colors.onPrimary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Resend OTP Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Chưa nhận được mã OTP? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Gửi lại sau <Text style={styles.countdownNumber}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={isResending}
              activeOpacity={0.7}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.secondaryGold} />
              ) : (
                <Text style={styles.resendButtonText}>Gửi lại mã</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Back / Restart option */}
        {onRestartRegister && (
          <View style={styles.restartRow}>
            <TouchableOpacity onPress={onRestartRegister} disabled={isVerifying}>
              <Text style={styles.restartLink}>← Đổi email hoặc đăng ký lại</Text>
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
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  emailBadgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(158, 60, 43, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emailBadgeContent: {
    flex: 1,
  },
  emailBadgeLabel: {
    ...Typography.labelSm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  emailBadgeAddress: {
    ...Typography.labelLg,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 2,
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
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(40, 167, 69, 0.3)",
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    ...Typography.bodySm,
    color: Colors.success,
    fontWeight: "600",
  },
  otpBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: Spacing.md,
    paddingHorizontal: 2,
  },
  otpCell: {
    width: 44,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  otpCellActive: {
    borderColor: Colors.primaryContainer,
    backgroundColor: "rgba(158, 60, 43, 0.05)",
    transform: [{ scale: 1.05 }],
  },
  otpCellFilled: {
    borderColor: Colors.secondaryGold,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  otpCellError: {
    borderColor: Colors.error,
    backgroundColor: "rgba(186, 26, 26, 0.04)",
  },
  otpCellText: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
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
  resendSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  resendText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  countdownText: {
    ...Typography.bodySm,
    color: Colors.outline,
  },
  countdownNumber: {
    fontWeight: "700",
    color: Colors.secondaryGold,
  },
  resendButtonText: {
    ...Typography.labelMd,
    fontWeight: "700",
    color: Colors.secondaryGold,
  },
  restartRow: {
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  restartLink: {
    ...Typography.bodySm,
    fontSize: 13,
    color: Colors.secondaryGold,
    fontWeight: "600",
  },
});
