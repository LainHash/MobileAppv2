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
import { useAuthContext } from "@/features/auth";
import { CreateContactMessageRequest, ContactMessageResponse } from "../types";
import { sendContactMessage } from "../api/contactApi";

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
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Gửi liên hệ thành công!</Text>
        <Text style={styles.successMessage}>
          Cảm ơn bạn đã phản hồi. Chúng tôi đã tiếp nhận thông tin và sẽ phản hồi qua email{" "}
          <Text style={styles.highlightText}>{email}</Text> trong thời gian sớm nhất.
        </Text>
        <TouchableOpacity
          style={styles.newSubmissionButton}
          onPress={handleResetForm}
          activeOpacity={0.8}
        >
          <Text style={styles.newSubmissionButtonText}>Gửi tin nhắn khác</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Gửi lời nhắn cho chúng tôi</Text>
      <Text style={styles.cardSubtitle}>
        Vui lòng điền thông tin bên dưới, nhân viên hỗ trợ sẽ liên hệ với bạn trong vòng 24h.
      </Text>

      {Boolean(serverError) && (
        <View style={styles.serverErrorBox}>
          <Text style={styles.serverErrorText}>⚠️ {serverError}</Text>
        </View>
      )}

      {/* Full Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Họ và tên <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, Boolean(fullNameError) && styles.inputError]}
          placeholder="Ví dụ: Nguyễn Văn A"
          placeholderTextColor="#94A3B8"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (fullNameError) setFullNameError(null);
          }}
          editable={!isSubmitting}
        />
        {Boolean(fullNameError) && (
          <Text style={styles.fieldErrorText}>{fullNameError}</Text>
        )}
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Email <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, Boolean(emailError) && styles.inputError]}
          placeholder="example@domain.com"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
        {Boolean(emailError) && (
          <Text style={styles.fieldErrorText}>{emailError}</Text>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Số điện thoại (tùy chọn)</Text>
        <TextInput
          style={[styles.input, Boolean(phoneNumberError) && styles.inputError]}
          placeholder="0912 345 678"
          placeholderTextColor="#94A3B8"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            if (phoneNumberError) setPhoneNumberError(null);
          }}
          keyboardType="phone-pad"
          editable={!isSubmitting}
        />
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
          Tiêu đề <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, Boolean(subjectError) && styles.inputError]}
          placeholder="Tóm tắt nội dung liên hệ..."
          placeholderTextColor="#94A3B8"
          value={subject}
          onChangeText={(text) => {
            setSubject(text);
            if (subjectError) setSubjectError(null);
          }}
          editable={!isSubmitting}
        />
        {Boolean(subjectError) && (
          <Text style={styles.fieldErrorText}>{subjectError}</Text>
        )}
      </View>

      {/* Message */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            Nội dung tin nhắn <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.counterText}>{message.length} ký tự</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            Boolean(messageError) && styles.inputError,
          ]}
          placeholder="Nhập chi tiết yêu cầu, câu hỏi hoặc phản hồi của bạn..."
          placeholderTextColor="#94A3B8"
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
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.submitButtonText}>Đang gửi tin nhắn...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>✉️ Gửi liên hệ</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 18,
  },
  serverErrorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  serverErrorText: {
    color: "#DC2626",
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  required: {
    color: "#EF4444",
  },
  counterText: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0F172A",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  fieldErrorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  topicChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  topicChipSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  topicChipText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  topicChipTextSelected: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#A5B4FC",
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: "#16A34A",
    fontWeight: "700",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  highlightText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  newSubmissionButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  newSubmissionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
});
