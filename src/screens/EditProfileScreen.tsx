import React, { useState } from "react";
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
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { useAuth, ChangePasswordModal } from "@/features/auth";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type EditProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditProfile"
>;

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();

  const profile = user?.personalProfile;

  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || "");
  const [gender, setGender] = useState<boolean>(
    profile?.gender !== undefined ? profile.gender : true,
  );
  const [citizenCardId, setCitizenCardId] = useState(
    profile?.citizenCardId || "",
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [city, setCity] = useState(profile?.city || "");
  const [country, setCountry] = useState(profile?.country || "Việt Nam");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    setServerError(null);

    if (!lastName.trim()) {
      newErrors.lastName = "Vui lòng nhập họ và tên đệm";
    }

    if (!firstName.trim()) {
      newErrors.firstName = "Vui lòng nhập tên của quý khách";
    }

    const dobTrimmed = dateOfBirth.trim();
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobTrimmed) {
      newErrors.dateOfBirth = "Vui lòng nhập ngày sinh (YYYY-MM-DD)";
    } else if (!dobRegex.test(dobTrimmed)) {
      newErrors.dateOfBirth =
        "Định dạng ngày sinh phải là YYYY-MM-DD (Ví dụ: 1995-08-15)";
    }

    const citizenTrimmed = citizenCardId.trim();
    if (!citizenTrimmed) {
      newErrors.citizenCardId = "Vui lòng nhập số CCCD / CMND";
    } else if (!/^\d{9,20}$/.test(citizenTrimmed)) {
      newErrors.citizenCardId = "Số CCCD / CMND phải gồm 9 đến 20 chữ số";
    }

    const phoneTrimmed = phone.trim();
    if (!phoneTrimmed) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^\d{10,15}$/.test(phoneTrimmed)) {
      newErrors.phone = "Số điện thoại phải từ 10 đến 15 chữ số";
    }

    if (!address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ thường trú";
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

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
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

      const res = await updateProfile(payload);

      if (res.success) {
        Alert.alert(
          "Cập nhật thành công",
          "Thông tin cá nhân của quý khách đã được lưu lại.",
          [
            {
              text: "Đồng ý",
              onPress: () => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("Profile");
                }
              },
            },
          ],
        );
      } else {
        setServerError(res.error || "Không thể cập nhật thông tin cá nhân.");
      }
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi cập nhật hồ sơ.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const initials = (user?.userName || "U").slice(0, 2).toUpperCase();

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="CHỈNH SỬA THÔNG TIN"
        showBack={navigation.canGoBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* Header Avatar Preview */}
            <View style={styles.avatarHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.headerUserName}>@{user?.userName}</Text>
              <Text style={styles.headerEmail}>{user?.email}</Text>
            </View>

            {/* Server Error Banner */}
            {Boolean(serverError) && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorBannerText}>{serverError}</Text>
              </View>
            )}

            {/* Personal Info Form Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.cardTitle}>Hồ sơ cá nhân</Text>
              </View>

              {/* Họ & Tên đệm + Tên */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.colHalf]}>
                  <Text style={styles.label}>
                    Họ & tên đệm <Text style={styles.required}>*</Text>
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
                    Tên <Text style={styles.required}>*</Text>
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

              {/* Ngày sinh */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Ngày sinh (YYYY-MM-DD) <Text style={styles.required}>*</Text>
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
                    placeholder="1995-08-15"
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

              {/* Giới tính */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Giới tính <Text style={styles.required}>*</Text>
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
                      color={
                        gender === true
                          ? Colors.primaryContainer
                          : Colors.outline
                      }
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
                      color={
                        gender === false
                          ? Colors.primaryContainer
                          : Colors.outline
                      }
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

              {/* CCCD / CMND */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Số CCCD / CMND <Text style={styles.required}>*</Text>
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

              {/* Số điện thoại */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Số điện thoại <Text style={styles.required}>*</Text>
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
                    placeholder="0912345678"
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

              {/* Địa chỉ */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Địa chỉ thường trú <Text style={styles.required}>*</Text>
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
                    placeholder="Số nhà, tên đường, phường/xã"
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

              {/* Tỉnh / Thành phố & Quốc gia */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.colHalf]}>
                  <Text style={styles.label}>
                    Tỉnh / TP <Text style={styles.required}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      Boolean(errors.city) && styles.inputError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Hà Nội"
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
                    Quốc gia <Text style={styles.required}>*</Text>
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

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  isSubmitting && styles.saveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.onPrimary} size="small" />
                ) : (
                  <View style={styles.btnRow}>
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color={Colors.onPrimary}
                    />
                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Security Section (Change Password) */}
            <View style={styles.securityCard}>
              <View style={styles.securityInfo}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={Colors.secondaryGold}
                />
                <View style={styles.securityTextWrap}>
                  <Text style={styles.securityTitle}>Bảo mật tài khoản</Text>
                  <Text style={styles.securityDesc}>
                    Đổi mật khẩu định kỳ để nâng cao tính an toàn
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.changePasswordBtn}
                onPress={() => setShowPasswordModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="key-outline" size={16} color={Colors.primary} />
                <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

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
  avatarHeader: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 2,
    borderColor: Colors.secondaryGold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    ...Shadows.subtle,
  },
  avatarText: {
    color: Colors.onPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  headerUserName: {
    ...Typography.headlineSm,
    fontSize: 16,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  headerEmail: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.outline,
    marginTop: 2,
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
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  cardTitle: {
    ...Typography.labelLg,
    color: Colors.primary,
    fontWeight: "700",
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
    fontSize: 13,
    color: Colors.onSurface,
    marginBottom: 6,
    fontWeight: "600",
  },
  required: {
    color: Colors.primaryContainer,
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
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
  genderRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  genderOption: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: "#FDFBF7",
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
  saveBtn: {
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
    ...Shadows.subtle,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.outline,
    elevation: 0,
    shadowOpacity: 0,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  securityTextWrap: {
    flex: 1,
  },
  securityTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  securityDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  changePasswordBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(126, 37, 22, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(126, 37, 22, 0.2)",
  },
  changePasswordText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: "700",
  },
});
