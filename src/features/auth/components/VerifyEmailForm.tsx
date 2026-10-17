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
import { verifyEmail as verifyEmailApi, resendVerificationCode } from "../api/authApi";
import { getPendingRegisterEmail, savePendingRegisterEmail } from "../utils/authStorage";
import { OtpPurpose } from "../types/auth";

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
          // Keep local storage in sync
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
      // Ngầm gán email: retrieves active email from state or storage
      let targetEmail = email;
      if (!targetEmail) {
        targetEmail = (await getPendingRegisterEmail()) || "";
      }

      // Calls API with email implicitly attached into body
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

      // Calls resend API with email attached implicitly
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
          <Text style={styles.emailBadgeIcon}>✉️</Text>
          <View style={styles.emailBadgeContent}>
            <Text style={styles.emailBadgeLabel}>Mã xác thực gửi tới:</Text>
            {isEmailLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
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
            <Text style={styles.errorBannerIcon}>⚠️</Text>
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        )}

        {/* Success Notice Banner */}
        {Boolean(successNotice) && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerIcon}>✅</Text>
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
          activeOpacity={0.8}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Xác thực OTP</Text>
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
                <ActivityIndicator size="small" color="#2563EB" />
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
    marginBottom: 16,
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
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  emailBadgeIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  emailBadgeContent: {
    flex: 1,
  },
  emailBadgeLabel: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  emailBadgeAddress: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E40AF",
    marginTop: 2,
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
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#86EFAC",
    padding: 12,
    marginBottom: 16,
  },
  successBannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  otpBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
    paddingHorizontal: 4,
  },
  otpCell: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
    transform: [{ scale: 1.05 }],
  },
  otpCellFilled: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  otpCellError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  otpCellText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
  resendSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#64748B",
  },
  countdownText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  countdownNumber: {
    fontWeight: "700",
    color: "#2563EB",
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  restartRow: {
    alignItems: "center",
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  restartLink: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
});
