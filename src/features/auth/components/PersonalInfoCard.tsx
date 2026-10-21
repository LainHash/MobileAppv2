import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { User, PersonalProfile } from "../types/auth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type NameDisplayOrder = "given-family" | "family-given";

const nameDisplayOrder = process.env
  .EXPO_PUBLIC_NAME_DISPLAY_ORDER as NameDisplayOrder;

export interface PersonalInfoCardProps {
  user?: User | null;
  onLogoutSuccess?: () => void;
  onLoginPress?: () => void;
  onEditPress?: () => void;
  onSwitchAccountPress?: () => void;
  showLogoutButton?: boolean;
}

export function PersonalInfoCard({
  user: userProp,
  onLogoutSuccess,
  onLoginPress,
  onEditPress,
  onSwitchAccountPress,
  showLogoutButton = true,
}: PersonalInfoCardProps) {
  const { user: authUser, logout, refreshMe, isLoading } = useAuth();
  const currentUser = userProp !== undefined ? userProp : authUser;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshMe();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Quý khách có chắc chắn muốn đăng xuất khỏi tài khoản không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logout();
            onLogoutSuccess?.();
          },
        },
      ],
    );
  };

  if (isLoading && !currentUser) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
        <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="person-outline" size={38} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
        <Text style={styles.emptySubtitle}>
          Kính mời quý khách đăng nhập để trải nghiệm trọn vẹn đặc quyền hội viên Haute De Hallen.
        </Text>
        {onLoginPress && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onLoginPress}
            activeOpacity={0.85}
          >
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const profile: PersonalProfile | undefined = currentUser.personalProfile;

  const formatFullName = (
    firstName?: string | null,
    lastName?: string | null,
  ): string => {
    if (nameDisplayOrder === "given-family") {
      return `${firstName ?? ""} ${lastName ?? ""}`.trim();
    }
    return `${lastName ?? ""} ${firstName ?? ""}`.trim();
  };

  const fullName =
    profile?.firstName || profile?.lastName
      ? formatFullName(profile?.firstName, profile?.lastName)
      : currentUser.userName;

  const initials = (currentUser.userName || "U").slice(0, 2).toUpperCase();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chưa cập nhật";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Profile Badge */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userHandle}>@{currentUser.userName}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="sparkles" size={12} color={Colors.onSecondaryFixed} />
          <Text style={styles.roleText}>
            {currentUser.roleName || "Hội Viên Tinh Hoa"}
          </Text>
        </View>
      </View>

      {/* Thông tin cá nhân section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person" size={16} color={Colors.primaryContainer} />
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          </View>
          {onEditPress && (
            <TouchableOpacity onPress={onEditPress} activeOpacity={0.7}>
              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Họ và tên</Text>
          <Text style={styles.rowValue}>{fullName}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Giới tính</Text>
          <Text style={styles.rowValue}>
            {profile?.gender !== undefined
              ? profile.gender
                ? "Nam"
                : "Nữ"
              : "Chưa cập nhật"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Ngày sinh</Text>
          <Text style={styles.rowValue}>
            {formatDate(profile?.dateOfBirth)}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Số điện thoại</Text>
          <Text style={styles.rowValue}>
            {profile?.phone || "Chưa cập nhật"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>CCCD / CMND</Text>
          <Text style={styles.rowValue}>
            {profile?.citizenCardId || "Chưa cập nhật"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Địa chỉ</Text>
          <Text style={[styles.rowValue, styles.addressText]}>
            {profile?.address || "Chưa cập nhật"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tỉnh / Thành phố</Text>
          <Text style={styles.rowValue}>
            {profile?.city || profile?.country
              ? `${profile?.city ?? ""}${profile?.city && profile?.country ? ", " : ""}${profile?.country ?? ""}`
              : "Chưa cập nhật"}
          </Text>
        </View>
      </View>

      {/* Thông tin tài khoản section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.secondaryGold} />
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{currentUser.email}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tên đăng nhập</Text>
          <Text style={styles.rowValue}>{currentUser.userName}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mã định danh (ID)</Text>
          <Text style={[styles.rowValue, styles.idText]}>{currentUser.id}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
          activeOpacity={0.8}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={Colors.primaryContainer} />
          ) : (
            <>
              <Ionicons
                name="refresh-outline"
                size={16}
                color={Colors.primary}
                style={styles.actionIcon}
              />
              <Text style={styles.refreshButtonText}>Làm mới dữ liệu</Text>
            </>
          )}
        </TouchableOpacity>

        {Boolean(onSwitchAccountPress) && (
          <TouchableOpacity
            style={styles.switchAccountButton}
            onPress={onSwitchAccountPress}
            activeOpacity={0.8}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={16}
              color={Colors.secondary}
              style={styles.actionIcon}
            />
            <Text style={styles.switchAccountButtonText}>Đổi tài khoản</Text>
          </TouchableOpacity>
        )}

        {showLogoutButton && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={16}
              color={Colors.error}
              style={styles.actionIcon}
            />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  centerContainer: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.sm,
    ...Typography.bodySm,
    color: Colors.outline,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(126, 37, 22, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    ...Shadows.subtle,
  },
  loginButtonText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  headerCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.secondaryGold,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: Colors.onPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  userName: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  userHandle: {
    ...Typography.bodySm,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(196, 154, 69, 0.3)",
  },
  roleText: {
    color: Colors.onSecondaryFixed,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.labelLg,
    color: Colors.primary,
    fontWeight: "700",
  },
  editButtonText: {
    ...Typography.labelMd,
    color: Colors.secondaryGold,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  rowValue: {
    ...Typography.bodyMd,
    fontWeight: "600",
    color: Colors.onSurface,
    flex: 1.5,
    textAlign: "right",
  },
  addressText: {
    textAlign: "right",
    lineHeight: 18,
  },
  idText: {
    fontSize: 11,
    color: Colors.outline,
    fontFamily: "monospace",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  actionContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  actionIcon: {
    marginRight: 6,
  },
  refreshButtonText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "600",
  },
  switchAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(123, 89, 2, 0.08)",
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(196, 154, 69, 0.3)",
  },
  switchAccountButtonText: {
    ...Typography.labelMd,
    color: Colors.secondary,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(186, 26, 26, 0.05)",
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(186, 26, 26, 0.2)",
  },
  logoutButtonText: {
    ...Typography.labelMd,
    color: Colors.error,
    fontWeight: "700",
  },
});
