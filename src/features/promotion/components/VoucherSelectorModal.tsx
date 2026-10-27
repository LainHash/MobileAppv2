import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";
import { formatCurrency } from "@/common/helpers";
import {
  validateVoucher,
  getPublicVouchers,
  getMyWalletVouchers,
} from "../api/vouchersApi";
import type {
  ValidateVoucherResultResponse,
  VoucherResponse,
} from "../types/voucher";

interface VoucherSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  orderAmount: number;
  deliveryFee?: number;
  branchId?: string | number | null;
  onApplyVoucher: (result: ValidateVoucherResultResponse) => void;
  appliedCode?: string | null;
}

export function VoucherSelectorModal({
  visible,
  onClose,
  orderAmount,
  deliveryFee = 15000,
  branchId,
  onApplyVoucher,
  appliedCode,
}: VoucherSelectorModalProps) {
  const [inputCode, setInputCode] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available vouchers
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const loadAvailableVouchers = async () => {
    setIsLoadingList(true);
    try {
      const res = await getPublicVouchers(branchId || undefined, 2);
      if (res?.isSucceed && res.data) {
        setVouchers(res.data);
      } else {
        setVouchers([]);
      }
    } catch {
      setVouchers([]);
    } finally {
      setIsLoadingList(false);
    }
  };
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      setInputCode(appliedCode || "");
      loadAvailableVouchers();
    }
  }, [visible, appliedCode]);

  const handleValidateAndApply = async (codeToValidate: string) => {
    const code = codeToValidate.trim().toUpperCase();
    if (!code) {
      setErrorMessage("Vui lòng nhập mã voucher.");
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      const res = await validateVoucher({
        code,
        orderAmount,
        deliveryFee,
        channel: 2, // Mobile
        orderType: 2, // Delivery
      });

      if (res?.isSucceed && res.data && res.data.isValid) {
        onApplyVoucher(res.data);
        onClose();
      } else {
        setErrorMessage(
          res?.data?.message ||
            res?.message ||
            "Mã giảm giá không hợp lệ hoặc không đủ điều kiện.",
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể kiểm tra mã giảm giá.",
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <MaterialCommunityIcons
                  name="ticket-percent-outline"
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <div>
                <Text style={styles.headerTitle}>Mã Ưu Đãi & Khuyến Mãi</Text>
                <Text style={styles.headerSubtitle}>
                  Áp dụng voucher giảm giá cho đơn hàng
                </Text>
              </div>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Code Input Row */}
          <View style={styles.inputSection}>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="ticket-outline"
                size={20}
                color={Colors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập mã voucher (vd: SUMMER50)"
                placeholderTextColor={Colors.outline}
                value={inputCode}
                onChangeText={(val) => {
                  setInputCode(val.toUpperCase());
                  setErrorMessage(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {Boolean(inputCode) && (
                <TouchableOpacity
                  onPress={() => setInputCode("")}
                  style={styles.clearBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={Colors.outline}
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.applyBtn,
                (!inputCode.trim() || isValidating) && styles.applyBtnDisabled,
              ]}
              onPress={() => handleValidateAndApply(inputCode)}
              disabled={!inputCode.trim() || isValidating}
              activeOpacity={0.8}
            >
              {isValidating ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <Text style={styles.applyBtnText}>Áp dụng</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {Boolean(errorMessage) && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={Colors.error}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Available Vouchers List */}
          <View style={styles.listSection}>
            <Text style={styles.listHeading}>Mã Giảm Giá Dành Cho Bạn</Text>

            {isLoadingList ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>
                  Đang tải danh sách ưu đãi...
                </Text>
              </View>
            ) : vouchers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="ticket-outline"
                  size={40}
                  color={Colors.outlineVariant || "#ccc"}
                />
                <Text style={styles.emptyText}>
                  Hiện chưa có mã ưu đãi công khai.
                </Text>
                <Text style={styles.emptySubText}>
                  Nếu bạn có mã khuyến mãi bí mật, vui lòng nhập ở ô bên trên.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {vouchers.map((v) => {
                  const isApplied = appliedCode === v.code;
                  const isEligible = orderAmount >= v.minOrderAmount;
                  const deficit = v.minOrderAmount - orderAmount;

                  return (
                    <View
                      key={v.publicId}
                      style={[
                        styles.couponCard,
                        isApplied && styles.couponCardApplied,
                        !isEligible && styles.couponCardIneligible,
                      ]}
                    >
                      {/* Left side coupon decoration badge */}
                      <View style={styles.couponLeft}>
                        <View style={styles.couponIconCircle}>
                          <MaterialCommunityIcons
                            name={
                              v.discountType === "FreeShipping"
                                ? "truck-fast-outline"
                                : v.discountType === "Percentage"
                                  ? "percent-outline"
                                  : "cash"
                            }
                            size={20}
                            color={Colors.primary}
                          />
                        </View>
                        <Text style={styles.couponCodeText}>{v.code}</Text>
                      </View>

                      {/* Right side coupon details */}
                      <View style={styles.couponRight}>
                        <Text style={styles.couponTitle} numberOfLines={1}>
                          {v.name}
                        </Text>
                        <Text style={styles.couponDiscountText}>
                          {v.discountType === "Percentage"
                            ? `Giảm ${v.discountValue}% ${
                                v.maxDiscountAmount
                                  ? `(tối đa ${formatCurrency(v.maxDiscountAmount)})`
                                  : ""
                              }`
                            : v.discountType === "FixedAmount"
                              ? `Giảm ${formatCurrency(v.discountValue)}`
                              : `Miễn phí vận chuyển`}
                        </Text>
                        <Text style={styles.couponMinSpend}>
                          Đơn tối thiểu: {formatCurrency(v.minOrderAmount)}
                        </Text>

                        {!isEligible && deficit > 0 && (
                          <Text style={styles.couponDeficitText}>
                            Mua thêm {formatCurrency(deficit)} để áp dụng
                          </Text>
                        )}

                        <View style={styles.couponActionRow}>
                          <Text style={styles.couponExpiryText}>
                            HSD: {new Date(v.endAt).toLocaleDateString("vi-VN")}
                          </Text>

                          <TouchableOpacity
                            style={[
                              styles.cardApplyBtn,
                              isApplied && styles.cardApplyBtnActive,
                              !isEligible && styles.cardApplyBtnDisabled,
                            ]}
                            disabled={!isEligible || isApplied}
                            onPress={() => handleValidateAndApply(v.code)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.cardApplyBtnText,
                                isApplied && styles.cardApplyBtnTextActive,
                                !isEligible && styles.cardApplyBtnTextDisabled,
                              ]}
                            >
                              {isApplied ? "Đang chọn" : "Áp dụng"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    ...Shadows.floating,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.titleMedium,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  closeBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    height: 44,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    ...Typography.labelMedium,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontSize: 11,
    flex: 1,
  },
  listSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    maxHeight: 380,
  },
  listHeading: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  centerLoading: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: Spacing.xs,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  emptyText: {
    ...Typography.titleSmall,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  emptySubText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  scrollView: {
    maxHeight: 320,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  couponCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    overflow: "hidden",
    ...Shadows.subtle,
  },
  couponCardApplied: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  couponCardIneligible: {
    opacity: 0.6,
  },
  couponLeft: {
    width: 90,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceVariant,
    borderStyle: "dashed",
  },
  couponIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  couponCodeText: {
    ...Typography.labelSmall,
    color: Colors.onPrimaryContainer,
    fontWeight: "800",
    textAlign: "center",
  },
  couponRight: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: "center",
  },
  couponTitle: {
    ...Typography.titleSmall,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  couponDiscountText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: "800",
    marginTop: 2,
  },
  couponMinSpend: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  couponDeficitText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  couponActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  couponExpiryText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  cardApplyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  cardApplyBtnActive: {
    backgroundColor: Colors.surfaceVariant,
  },
  cardApplyBtnDisabled: {
    backgroundColor: Colors.surfaceVariant,
    opacity: 0.5,
  },
  cardApplyBtnText: {
    ...Typography.labelSmall,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  cardApplyBtnTextActive: {
    color: Colors.primary,
  },
  cardApplyBtnTextDisabled: {
    color: Colors.onSurfaceVariant,
  },
});
