import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { completeProfile as completeProfileApi } from "../api/authApi";
import {
  getPendingRegisterEmail,
  clearPendingRegisterEmail,
  savePendingRegisterEmail,
} from "../utils/authStorage";

export interface CompleteProfileFormProps {
  initialEmail?: string;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export function CompleteProfileForm({
  initialEmail,
  onSuccess,
  title = "Hoàn thành thông tin cá nhân",
  subtitle = "Bước 3/3: Cung cấp thông tin để hoàn tất tài khoản của bạn",
}: CompleteProfileFormProps) {
  const [email, setEmail] = useState<string>(initialEmail || "");
  const [isEmailLoading, setIsEmailLoading] = useState(!initialEmail);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<boolean>(true); // true: Nam, false: Nữ
  const [citizenCardId, setCitizenCardId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Việt Nam");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    setServerError(null);

    if (!lastName.trim()) {
      newErrors.lastName = "Vui lòng nhập họ và tên đệm";
    }

    if (!firstName.trim()) {
      newErrors.firstName = "Vui lòng nhập tên của bạn";
    }

    const dobTrimmed = dateOfBirth.trim();
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobTrimmed) {
      newErrors.dateOfBirth = "Vui lòng nhập ngày sinh (YYYY-MM-DD)";
    } else if (!dobRegex.test(dobTrimmed)) {
      newErrors.dateOfBirth = "Định dạng ngày sinh phải là YYYY-MM-DD (Ví dụ: 1998-05-20)";
    }

    const citizenTrimmed = citizenCardId.trim();
    if (!citizenTrimmed) {
      newErrors.citizenCardId = "Vui lòng nhập số CCCD / CMND";
    } else if (!/^\d{9,12}$/.test(citizenTrimmed)) {
      newErrors.citizenCardId = "Số CCCD / CMND phải gồm 9 đến 12 chữ số";
    }

    const phoneTrimmed = phone.trim();
    if (!phoneTrimmed) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(0|\+84)[0-9]{9,10}$/.test(phoneTrimmed)) {
      newErrors.phone = "Số điện thoại không hợp lệ (Ví dụ: 0912345678)";
    }

    if (!address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ liên hệ";
    }

    if (!city.trim()) {
      newErrors.city = "Vui lòng nhập Tỉnh / Thành phố";
    }

    if (!country.trim()) {
      newErrors.country = "Vui lòng nhập Quốc gia";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      // Ngầm gán email: retrieves active email from state or storage
      let targetEmail = email;
      if (!targetEmail) {
        targetEmail = (await getPendingRegisterEmail()) || "";
      }

      const payload = {
        email: targetEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender,
        citizenCardId: citizenCardId.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
      };

      const res = await completeProfileApi(payload);

      if (res.isSucceed) {
        // Clear pending register email upon successfully finishing flow
        await clearPendingRegisterEmail();
        onSuccess?.();
      } else {
        const msg =
          res.message ||
          "Không thể hoàn tất thông tin cá nhân. Vui lòng kiểm tra lại.";
        setServerError(msg);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu thông tin cá nhân. Vui lòng thử lại.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {Boolean(subtitle) && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>

          {/* Email Badge (Readonly) */}
          <View style={styles.emailBadge}>
            <Text style={styles.emailBadgeIcon}>📧</Text>
            <View style={styles.emailBadgeContent}>
              <Text style={styles.emailBadgeLabel}>Tài khoản liên kết:</Text>
              {isEmailLoading ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <Text style={styles.emailBadgeValue} numberOfLines={1}>
                  {email || "(Đã lưu trong thiết bị)"}
                </Text>
              )}
            </View>
          </View>

          {/* Server Error Banner */}
          {Boolean(serverError) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerIcon}>⚠️</Text>
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {/* Name Row: Họ và Tên */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.colHalf]}>
              <Text style={styles.label}>
                Họ & tên đệm <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  Boolean(errors.lastName) && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn"
                  placeholderTextColor="#94A3B8"
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    clearFieldError("lastName");
                  }}
                  editable={!isSubmitting}
                />
              </View>
              {Boolean(errors.lastName) && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.colHalf]}>
              <Text style={styles.label}>
                Tên <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  Boolean(errors.firstName) && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="An"
                  placeholderTextColor="#94A3B8"
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    clearFieldError("firstName");
                  }}
                  editable={!isSubmitting}
                />
              </View>
              {Boolean(errors.firstName) && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>
          </View>

          {/* Date of Birth Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Ngày sinh (YYYY-MM-DD) <Text style={styles.requiredMark}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                Boolean(errors.dateOfBirth) && styles.inputError,
              ]}
            >
              <Text style={styles.inputIcon}>📅</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 1998-05-20"
                placeholderTextColor="#94A3B8"
                value={dateOfBirth}
                onChangeText={(t) => {
                  setDateOfBirth(t);
                  clearFieldError("dateOfBirth");
                }}
                keyboardType="numbers-and-punctuation"
                editable={!isSubmitting}
              />
            </View>
            {Boolean(errors.dateOfBirth) && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}
          </View>

          {/* Gender Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Giới tính <Text style={styles.requiredMark}>*</Text>
            </Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  gender === true && styles.genderOptionSelected,
                ]}
                onPress={() => setGender(true)}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === true && styles.genderOptionTextSelected,
                  ]}
                >
                  👨 Nam
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  gender === false && styles.genderOptionSelected,
                ]}
                onPress={() => setGender(false)}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === false && styles.genderOptionTextSelected,
                  ]}
                >
                  👩 Nữ
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Citizen Card ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số CCCD / CMND <Text style={styles.requiredMark}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                Boolean(errors.citizenCardId) && styles.inputError,
              ]}
            >
              <Text style={styles.inputIcon}>🪪</Text>
              <TextInput
                style={styles.input}
                placeholder="12 chữ số trên thẻ căn cước"
                placeholderTextColor="#94A3B8"
                value={citizenCardId}
                onChangeText={(t) => {
                  setCitizenCardId(t);
                  clearFieldError("citizenCardId");
                }}
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
            </View>
            {Boolean(errors.citizenCardId) && (
              <Text style={styles.errorText}>{errors.citizenCardId}</Text>
            )}
          </View>

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Số điện thoại <Text style={styles.requiredMark}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                Boolean(errors.phone) && styles.inputError,
              ]}
            >
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 0912345678"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  clearFieldError("phone");
                }}
                keyboardType="phone-pad"
                editable={!isSubmitting}
              />
            </View>
            {Boolean(errors.phone) && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          {/* Address Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Địa chỉ thường trú <Text style={styles.requiredMark}>*</Text>
            </Text>
            <View
              style={[
                styles.inputContainer,
                Boolean(errors.address) && styles.inputError,
              ]}
            >
              <Text style={styles.inputIcon}>🏠</Text>
              <TextInput
                style={styles.input}
                placeholder="Số nhà, tên đường, phường / xã"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={(t) => {
                  setAddress(t);
                  clearFieldError("address");
                }}
                editable={!isSubmitting}
              />
            </View>
            {Boolean(errors.address) && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {/* City & Country Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.colHalf]}>
              <Text style={styles.label}>
                Tỉnh / Thành phố <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  Boolean(errors.city) && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="TP. Hà Nội"
                  placeholderTextColor="#94A3B8"
                  value={city}
                  onChangeText={(t) => {
                    setCity(t);
                    clearFieldError("city");
                  }}
                  editable={!isSubmitting}
                />
              </View>
              {Boolean(errors.city) && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.colHalf]}>
              <Text style={styles.label}>
                Quốc gia <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  Boolean(errors.country) && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Việt Nam"
                  placeholderTextColor="#94A3B8"
                  value={country}
                  onChangeText={(t) => {
                    setCountry(t);
                    clearFieldError("country");
                  }}
                  editable={!isSubmitting}
                />
              </View>
              {Boolean(errors.country) && (
                <Text style={styles.errorText}>{errors.country}</Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Hoàn tất hồ sơ</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  emailBadgeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  emailBadgeContent: {
    flex: 1,
  },
  emailBadgeLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  emailBadgeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  colHalf: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
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
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    height: "100%",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 2,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    height: 46,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  genderOptionSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  genderOptionTextSelected: {
    color: "#2563EB",
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
});
