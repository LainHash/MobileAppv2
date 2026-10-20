import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthContext } from "@/features/auth";
import { CreateContactMessageRequest, ContactMessageResponse } from "../types";
import { sendContactMessage } from "../api/contactApi";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface ContactFormProps {
  onSuccess?: (response: ContactMessageResponse) => void;
  onError?: (errorMessage: string) => void;
}

const QUICK_TOPICS = [
  "Đặt bàn & Sự kiện",
  "Chất lượng món ăn",
  "Giao hàng & Đơn hàng",
  "Hóa đơn & Thanh toán",
  "Góp ý dịch vụ",
];

export function ContactForm({ onSuccess, onError }: ContactFormProps) {
  const { user, isAuthenticated } = useAuthContext();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Auto-fill from authenticated user if available
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.personalProfile) {
        const profileName = [
          user.personalProfile.lastName,
          user.personalProfile.firstName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        if (profileName) {
          setFullName(profileName);
        } else if (user.userName) {
          setFullName(user.userName);
        }

        if (user.personalProfile.phone) {
          setPhoneNumber(user.personalProfile.phone);
        }
      } else if (user.userName) {
        setFullName(user.userName);
      }

      if (user.email) {
        setEmail(user.email);
      }
    }
  }, [isAuthenticated, user]);

  const validate = (): boolean => {
    let isValid = true;
    setFullNameError(null);
    setEmailError(null);
    setPhoneNumberError(null);
    setSubjectError(null);
    setMessageError(null);
    setServerError(null);

    if (!fullName.trim()) {
      setFullNameError("Vui lòng nhập họ và tên của bạn");
      isValid = false;
    } else if (fullName.trim().length > 150) {
      setFullNameError("Họ và tên không vượt quá 150 ký tự");
      isValid = false;
    }

    const emailTrim = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrim) {
      setEmailError("Vui lòng nhập địa chỉ email");
      isValid = false;
    } else if (!emailRegex.test(emailTrim)) {
      setEmailError("Địa chỉ email không đúng định dạng");
      isValid = false;
    } else if (emailTrim.length > 256) {
      setEmailError("Email không vượt quá 256 ký tự");
      isValid = false;
    }

    if (phoneNumber && phoneNumber.trim().length > 25) {
      setPhoneNumberError("Số điện thoại không hợp lệ");
      isValid = false;
    }

    if (!subject.trim()) {
      setSubjectError("Vui lòng nhập tiêu đề liên hệ");
      isValid = false;
    } else if (subject.trim().length > 250) {
      setSubjectError("Tiêu đề không vượt quá 250 ký tự");
      isValid = false;
    }

    if (!message.trim()) {
      setMessageError("Vui lòng nhập nội dung liên hệ");
      isValid = false;
    } else if (message.trim().length < 10) {
      setMessageError("Nội dung liên hệ nên có ít nhất 10 ký tự");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    const payload: CreateContactMessageRequest = {
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
    };

    try {
      const res = await sendContactMessage(payload);

      if (res.isSucceed) {
        setIsSubmittedSuccess(true);
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        const errorMsg = res.message || "Không thể gửi tin nhắn. Vui lòng thử lại sau.";
        setServerError(errorMsg);
        if (onError) onError(errorMsg);
        Alert.alert("Gửi liên hệ thất bại", errorMsg);
      }
    } catch (err: unknown) {
      let errorMsg = "Có lỗi xảy ra khi gửi liên hệ. Vui lòng thử lại sau.";
      if (err && typeof err === "object" && "message" in err) {
        errorMsg = String(err.message);
      }
      setServerError(errorMsg);
      if (onError) onError(errorMsg);
      Alert.alert("Lỗi", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setIsSubmittedSuccess(false);
    setSubject("");
    setMessage("");
    setServerError(null);
  };

  if (isSubmittedSuccess) {
    return (
      <View style={styles.successCard}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={44} color={Colors.primary} />
        </View>
        <Text style={styles.successTitle}>Gửi lời nhắn thành công</Text>
        <Text style={styles.successMessage}>
          Cảm ơn quý khách đã đóng góp ý kiến. Bộ phận Chăm sóc Khách hàng Haute De Hallen sẽ phản hồi qua email{" "}
          <Text style={styles.highlightText}>{email}</Text> trong thời gian sớm nhất.
        </Text>
        <TouchableOpacity
          style={styles.newSubmissionButton}
          onPress={handleResetForm}
          activeOpacity={0.85}
        >
          <Ionicons name="mail-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.newSubmissionButtonText}>Gửi lời nhắn khác</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderIcon}>
          <Ionicons name="mail-unread-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Gửi lời nhắn cho chúng tôi</Text>
          <Text style={styles.cardSubtitle}>
            Đội ngũ Haute De Hallen luôn sẵn sàng phục vụ và giải đáp trong vòng 24h.
          </Text>
        </View>
      </View>

      {Boolean(serverError) && (
        <View style={styles.serverErrorBox}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} style={{ marginRight: 6 }} />
          <Text style={styles.serverErrorText}>{serverError}</Text>
        </View>
      )}

      {/* Full Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Họ và tên quý khách <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.inputWrapper, Boolean(fullNameError) && styles.inputWrapperError]}>
          <Ionicons name="person-outline" size={18} color={Colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Nguyễn Văn A"
            placeholderTextColor={Colors.outline}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (fullNameError) setFullNameError(null);
            }}
            editable={!isSubmitting}
          />
        </View>
        {Boolean(fullNameError) && (
          <Text style={styles.fieldErrorText}>{fullNameError}</Text>
        )}
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Địa chỉ email <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.inputWrapper, Boolean(emailError) && styles.inputWrapperError]}>
          <Ionicons name="mail-outline" size={18} color={Colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="example@domain.com"
            placeholderTextColor={Colors.outline}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSubmitting}
          />
        </View>
        {Boolean(emailError) && (
          <Text style={styles.fieldErrorText}>{emailError}</Text>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Số điện thoại liên hệ (tùy chọn)</Text>
        <View style={[styles.inputWrapper, Boolean(phoneNumberError) && styles.inputWrapperError]}>
          <Ionicons name="call-outline" size={18} color={Colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="0912 345 678"
            placeholderTextColor={Colors.outline}
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (phoneNumberError) setPhoneNumberError(null);
            }}
            keyboardType="phone-pad"
            editable={!isSubmitting}
          />
        </View>
        {Boolean(phoneNumberError) && (
          <Text style={styles.fieldErrorText}>{phoneNumberError}</Text>
        )}
      </View>

      {/* Quick Topic Chips */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Chủ đề gợi ý</Text>
        <View style={styles.topicsRow}>
          {QUICK_TOPICS.map((topic) => {
            const isSelected = subject === topic;
            return (
              <TouchableOpacity
                key={topic}
                style={[
                  styles.topicChip,
                  isSelected && styles.topicChipSelected,
                ]}
                onPress={() => {
                  setSubject(topic);
                  if (subjectError) setSubjectError(null);
                }}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.topicChipText,
                    isSelected && styles.topicChipTextSelected,
                  ]}
                >
                  {topic}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Subject */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Tiêu đề lời nhắn <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.inputWrapper, Boolean(subjectError) && styles.inputWrapperError]}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tóm tắt yêu cầu hoặc đóng góp..."
            placeholderTextColor={Colors.outline}
            value={subject}
            onChangeText={(text) => {
              setSubject(text);
              if (subjectError) setSubjectError(null);
            }}
            editable={!isSubmitting}
          />
        </View>
        {Boolean(subjectError) && (
          <Text style={styles.fieldErrorText}>{subjectError}</Text>
        )}
      </View>

      {/* Message */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            Nội dung chi tiết <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.counterText}>{message.length} ký tự</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            Boolean(messageError) && styles.inputError,
          ]}
          placeholder="Nhập chi tiết yêu cầu, đánh giá hoặc mong muốn của quý khách..."
          placeholderTextColor={Colors.outline}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            if (messageError) setMessageError(null);
          }}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
        {Boolean(messageError) && (
          <Text style={styles.fieldErrorText}>{messageError}</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.onPrimary} size="small" />
            <Text style={styles.submitButtonText}>Đang gửi lời nhắn...</Text>
          </View>
        ) : (
          <View style={styles.loadingRow}>
            <Ionicons name="paper-plane-outline" size={18} color={Colors.onPrimary} />
            <Text style={styles.submitButtonText}>Gửi lời nhắn</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
    marginBottom: Spacing.xl,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...Typography.titleMedium,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  cardSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
  },
  serverErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  serverErrorText: {
    ...Typography.bodySm,
    color: Colors.error,
    flex: 1,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    ...Typography.labelMedium,
    color: Colors.onSurface,
    fontWeight: "600",
    marginBottom: 6,
  },
  required: {
    color: Colors.error,
  },
  counterText: {
    ...Typography.bodySm,
    color: Colors.outline,
    fontSize: 11,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.onSurface,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "#FEF2F2",
  },
  textArea: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 110,
    paddingTop: 12,
  },
  fieldErrorText: {
    ...Typography.bodySm,
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: 2,
  },
  topicChip: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  topicChipSelected: {
    backgroundColor: Colors.secondaryFixed,
    borderColor: Colors.secondaryGold,
  },
  topicChipText: {
    ...Typography.labelSm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: "500",
  },
  topicChipTextSelected: {
    color: Colors.onSecondaryFixed,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    ...Shadows.subtle,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.surfaceContainer,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  submitButtonText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
    marginBottom: Spacing.xl,
  },
  successIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: Colors.secondaryGold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  successMessage: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: 320,
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: "700",
  },
  newSubmissionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  newSubmissionButtonText: {
    ...Typography.labelMedium,
    fontWeight: "700",
    color: Colors.primary,
  },
});
