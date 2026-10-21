import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const { changePassword } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setServerError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    setServerError(null);

    if (!oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    } else if (newPassword === oldPassword) {
      newErrors.newPassword = "Mật khẩu mới không được trùng với mật khẩu cũ";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        Alert.alert(
          "Thành công",
          "Mật khẩu của quý khách đã được cập nhật thành công.",
          [
            {
              text: "Đóng",
              onPress: () => {
                handleClose();
                onSuccess?.();
              },
            },
          ],
        );
      } else {
        setServerError(res.error || "Đổi mật khẩu không thành công");
      }
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi đổi mật khẩu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons name="key-outline" size={22} color={Colors.primary} />
                  <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={20} color={Colors.outline} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu của quý khách với người khác.
              </Text>

              {/* Server error */}
              {Boolean(serverError) && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorBannerText}>{serverError}</Text>
                </View>
              )}

              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu hiện tại</Text>
                <View
                  style={[
                    styles.inputContainer,
                    Boolean(errors.oldPassword) && styles.inputError,
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
                    placeholder="Nhập mật khẩu đang dùng"
                    placeholderTextColor="rgba(138, 114, 109, 0.6)"
                    value={oldPassword}
                    onChangeText={(t) => {
                      setOldPassword(t);
                      if (errors.oldPassword) {
                        setErrors((prev) => ({ ...prev, oldPassword: "" }));
                      }
                      if (serverError) setServerError(null);
                    }}
                    secureTextEntry={!showOldPassword}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPassword((p) => !p)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={Colors.outline}
                    />
                  </TouchableOpacity>
                </View>
                {Boolean(errors.oldPassword) && (
                  <Text style={styles.errorText}>{errors.oldPassword}</Text>
                )}
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu mới</Text>
                <View
                  style={[
                    styles.inputContainer,
                    Boolean(errors.newPassword) && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="shield-outline"
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
                      if (errors.newPassword) {
                        setErrors((prev) => ({ ...prev, newPassword: "" }));
                      }
                      if (serverError) setServerError(null);
                    }}
                    secureTextEntry={!showNewPassword}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword((p) => !p)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={Colors.outline}
                    />
                  </TouchableOpacity>
                </View>
                {Boolean(errors.newPassword) && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                <View
                  style={[
                    styles.inputContainer,
                    Boolean(errors.confirmPassword) && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
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
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }
                      if (serverError) setServerError(null);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((p) => !p)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={Colors.outline}
                    />
                  </TouchableOpacity>
                </View>
                {Boolean(errors.confirmPassword) && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Submit Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleClose}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    isSubmitting && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.onPrimary} />
                  ) : (
                    <Text style={styles.submitBtnText}>Cập nhật mật khẩu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "700",
  },
  subtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 6,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onErrorContainer,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontSize: 13,
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
    height: 46,
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
    fontSize: 14,
    color: Colors.onSurface,
    height: "100%",
  },
  errorText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: "600",
  },
  submitBtn: {
    flex: 1.6,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.outline,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
});

export default ChangePasswordModal;
