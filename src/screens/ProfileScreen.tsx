import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { PersonalInfoCard, SwitchAccountModal, useAuth } from "@/features/auth";
import {
  useBranches,
  BranchDropdown,
  getSelectedBranchId,
  saveSelectedBranchId,
} from "@/features/territory/branches";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const { branches } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Sync selected branch from storage when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getSelectedBranchId().then((storedId) => {
        if (isMounted) {
          setSelectedBranchId(storedId ?? null);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const currentBranch = useMemo(() => {
    if (!branches || !selectedBranchId) return null;
    return branches.find((b) => b.id === selectedBranchId) || null;
  }, [branches, selectedBranchId]);

  const handleSelectBranch = async (branchId: string | null) => {
    setSelectedBranchId(branchId);
    await saveSelectedBranchId(branchId);
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="HỒ SƠ HỘI VIÊN"
        showBack={navigation.canGoBack()}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Branch Selection Section */}
        <View style={styles.branchCard}>
          <View style={styles.branchHeaderRow}>
            <View style={styles.branchIconWrap}>
              <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.branchInfoCol}>
              <Text style={styles.branchCardTitle}>Chi nhánh phục vụ</Text>
              <Text style={styles.branchCardSubtitle} numberOfLines={2}>
                {currentBranch
                  ? `${currentBranch.city}${currentBranch.address ? ` • ${currentBranch.address}` : ""}`
                  : "Chưa chọn chi nhánh (mặc định xem thực đơn chung)"}
              </Text>
            </View>
            {Boolean(selectedBranchId) && (
              <TouchableOpacity
                style={styles.clearBranchBtn}
                onPress={() => handleSelectBranch(null)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearBranchText}>Bỏ chọn</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.branchDropdownWrap}>
            <BranchDropdown
              branches={branches}
              value={selectedBranchId}
              onSelect={handleSelectBranch}
              placeholder="Chọn chi nhánh phục vụ"
              hideAllOption={false}
              style={styles.branchDropdown}
            />
          </View>

          <TouchableOpacity
            style={styles.optimalBranchAction}
            onPress={() => navigation.navigate("OptimalBranch")}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.optimalBranchText}>
              Tìm chi nhánh gần nhất theo GPS
            </Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.outline} />
          </TouchableOpacity>
        </View>

        {/* Quick Hub Navigation Cards */}
        <View style={styles.hubSection}>
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate("Orders")}
            activeOpacity={0.8}
          >
            <View style={[styles.hubIconWrap, styles.hubIconOrders]}>
              <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.hubInfo}>
              <Text style={styles.hubTitle}>Đơn hàng của tôi</Text>
              <Text style={styles.hubSubtitle}>
                Theo dõi tình trạng chế biến & lịch sử đặt món
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate("MyReservations")}
            activeOpacity={0.8}
          >
            <View style={[styles.hubIconWrap, styles.hubIconReservations]}>
              <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
            </View>
            <View style={styles.hubInfo}>
              <Text style={styles.hubTitle}>Lịch sử đặt bàn</Text>
              <Text style={styles.hubSubtitle}>
                Quản lý các lượt đặt bàn tiệc & khu vực phục vụ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate("Wishlist")}
            activeOpacity={0.8}
          >
            <View style={[styles.hubIconWrap, styles.hubIconWishlist]}>
              <Ionicons name="heart-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.hubInfo}>
              <Text style={styles.hubTitle}>Món ăn yêu thích</Text>
              <Text style={styles.hubSubtitle}>
                Bộ sưu tập các món ẩm thực quý khách đã lưu lại
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.outline} />
          </TouchableOpacity>

          {/* Quick Hub: Đổi tài khoản */}
          {Boolean(user) && (
            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => setShowSwitchModal(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.hubIconWrap, styles.hubIconSwitch]}>
                <Ionicons
                  name="swap-horizontal"
                  size={20}
                  color={Colors.secondary}
                />
              </View>
              <View style={styles.hubInfo}>
                <Text style={styles.hubTitle}>Đổi tài khoản</Text>
                <Text style={styles.hubSubtitle}>
                  Chuyển sang tài khoản khác hoặc đăng nhập tài khoản mới
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Details Card */}
        <PersonalInfoCard
          onLoginPress={() => navigation.navigate("Login")}
          onLogoutSuccess={() => navigation.navigate("Home")}
          onEditPress={() => navigation.navigate("EditProfile")}
          onSwitchAccountPress={() => setShowSwitchModal(true)}
        />
      </ScrollView>

      {/* Switch Account Modal */}
      <SwitchAccountModal
        visible={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        onSelectAccountToLogin={(identifier) => {
          navigation.navigate("Login", { identifier });
        }}
        onAddNewAccountPress={() => {
          navigation.navigate("Login");
        }}
      />

      {/* Floating Bottom Nav Bar */}
      <HauteBottomBar activeTab="Account" />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  branchCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  branchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  branchIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(126, 37, 22, 0.08)",
    marginRight: Spacing.md,
  },
  branchInfoCol: {
    flex: 1,
  },
  branchCardTitle: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  branchCardSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  clearBranchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(126, 37, 22, 0.08)",
  },
  clearBranchText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: "600",
  },
  branchDropdownWrap: {
    marginTop: Spacing.sm,
  },
  branchDropdown: {
    margin: 0,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  optimalBranchAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  optimalBranchText: {
    ...Typography.labelSm,
    color: Colors.primary,
    flex: 1,
  },
  hubSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  hubCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  hubIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  hubIconOrders: {
    backgroundColor: "rgba(126, 37, 22, 0.08)",
  },
  hubIconReservations: {
    backgroundColor: "rgba(196, 154, 69, 0.15)",
  },
  hubIconWishlist: {
    backgroundColor: "rgba(126, 37, 22, 0.08)",
  },
  hubIconSwitch: {
    backgroundColor: "rgba(123, 89, 2, 0.12)",
  },
  hubInfo: {
    flex: 1,
  },
  hubTitle: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  hubSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
});
