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
import { Ionicons } from "@expo/vector-icons";
import { completeProfile as completeProfileApi } from "../api/authApi";
import {
  getPendingRegisterEmail,
  clearPendingRegisterEmail,
  savePendingRegisterEmail,
} from "../utils/authStorage";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

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
            <View style={styles.emailBadgeIconWrap}>
              <Ionicons name="mail" size={16} color={Colors.primaryContainer} />
            </View>
            <View style={styles.emailBadgeContent}>
              <Text style={styles.emailBadgeLabel}>Tài khoản liên kết:</Text>
              {isEmailLoading ? (
                <ActivityIndicator size="small" color={Colors.primaryContainer} />
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
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
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
                  placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
                  placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 1998-05-20"
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
                <Ionicons
                  name="male"
                  size={16}
                  color={gender === true ? Colors.primaryContainer : Colors.outline}
                />
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === true && styles.genderOptionTextSelected,
                  ]}
                >
                  Nam
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
                <Ionicons
                  name="female"
                  size={16}
                  color={gender === false ? Colors.primaryContainer : Colors.outline}
                />
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === false && styles.genderOptionTextSelected,
                  ]}
                >
                  Nữ
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
              <Ionicons
                name="card-outline"
                size={18}
                color={Colors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="12 chữ số trên thẻ căn cước"
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
              <Ionicons
                name="call-outline"
                size={18}
                color={Colors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 0912345678"
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Số nhà, tên đường, phường / xã"
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
                  placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
                  placeholderTextColor="rgba(138, 114, 109, 0.6)"
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
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.onPrimary} size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitButtonText}>Hoàn tất hồ sơ</Text>
                <Ionicons name="checkmark-done" size={16} color={Colors.onPrimary} />
              </View>
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
    paddingBottom: Spacing.xl,
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
    textAlign: "center",
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
  emailBadgeValue: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 1,
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
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  colHalf: {
    flex: 1,
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
  errorText: {
    ...Typography.labelSm,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
  genderRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  genderOption: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  genderOptionSelected: {
    borderColor: Colors.primaryContainer,
    backgroundColor: "rgba(158, 60, 43, 0.08)",
  },
  genderOptionText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: "600",
  },
  genderOptionTextSelected: {
    color: Colors.primaryContainer,
    fontWeight: "700",
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
});
