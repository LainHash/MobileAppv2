import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { User, PersonalProfile } from "../types/auth";

export interface PersonalInfoCardProps {
  user?: User | null;
  onLogoutSuccess?: () => void;
  onLoginPress?: () => void;
  onEditPress?: () => void;
  showLogoutButton?: boolean;
}

export function PersonalInfoCard({
  user: userProp,
  onLogoutSuccess,
  onLoginPress,
  onEditPress,
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
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?",
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>👤</Text>
        <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
        <Text style={styles.emptySubtitle}>
          Vui lòng đăng nhập để xem và quản lý thông tin cá nhân của bạn.
        </Text>
        {onLoginPress && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onLoginPress}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const profile: PersonalProfile | undefined = currentUser.personalProfile;

  const fullName =
    profile?.firstName || profile?.lastName
      ? `${profile?.lastName ?? ""} ${profile?.firstName ?? ""}`.trim()
      : currentUser.userName;

  const initials = (currentUser.userName || "U")
    .slice(0, 2)
    .toUpperCase();

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
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Profile Badge */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userHandle}>@{currentUser.userName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{currentUser.roleName || "Thành viên"}</Text>
        </View>
      </View>

      {/* Thông tin cá nhân section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👤 Thông tin cá nhân</Text>
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
          <Text style={styles.rowValue}>{formatDate(profile?.dateOfBirth)}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Số điện thoại</Text>
          <Text style={styles.rowValue}>{profile?.phone || "Chưa cập nhật"}</Text>
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
          <Text style={styles.rowLabel}>Thành phố / Quốc gia</Text>
          <Text style={styles.rowValue}>
            {profile?.city || profile?.country
              ? `${profile?.city ?? ""}${profile?.city && profile?.country ? ", " : ""}${profile?.country ?? ""}`
              : "Chưa cập nhật"}
          </Text>
        </View>
      </View>

      {/* Thông tin tài khoản section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🛡️ Thông tin tài khoản</Text>

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
          <Text style={[styles.rowValue, styles.idText]}>
            {currentUser.id}
          </Text>
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
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <Text style={styles.refreshButtonIcon}>🔄</Text>
              <Text style={styles.refreshButtonText}>Làm mới dữ liệu</Text>
            </>
          )}
        </TouchableOpacity>

        {showLogoutButton && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonIcon}>🚪</Text>
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 260,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  roleText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  editButtonText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1.5,
    textAlign: "right",
  },
  addressText: {
    textAlign: "right",
    lineHeight: 18,
  },
  idText: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: "monospace",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  actionContainer: {
    gap: 12,
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  refreshButtonIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  refreshButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  logoutButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});
