import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { SavedAccount } from "../types/auth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface SwitchAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAccountToLogin: (identifier: string) => void;
  onAddNewAccountPress: () => void;
}

export function SwitchAccountModal({
  visible,
  onClose,
  onSelectAccountToLogin,
  onAddNewAccountPress,
}: SwitchAccountModalProps) {
  const { user, savedAccounts, removeAccount, logout } = useAuth();

  const handleSwitchToSaved = (account: SavedAccount) => {
    Alert.alert(
      "Đổi tài khoản",
      `Quý khách có muốn đăng xuất tài khoản hiện tại và đăng nhập với tài khoản "${account.userName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            onClose();
            await logout();
            onSelectAccountToLogin(account.userName || account.email);
          },
        },
      ],
    );
  };

  const handleAddNew = () => {
    Alert.alert(
      "Đổi tài khoản",
      "Quý khách có muốn đăng xuất tài khoản hiện tại để đăng nhập tài khoản khác không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: async () => {
            onClose();
            await logout();
            onAddNewAccountPress();
          },
        },
      ],
    );
  };

  const handleRemoveSaved = (account: SavedAccount) => {
    Alert.alert(
      "Xóa tài khoản đã lưu",
      `Quý khách có chắc chắn muốn xóa "${account.userName}" khỏi danh sách tài khoản đã lưu trên thiết bị này?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            removeAccount(account.id);
          },
        },
      ],
    );
  };

  const otherAccounts = savedAccounts.filter(
    (acc) => acc.id !== user?.id && acc.userName !== user?.userName,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <Ionicons
                    name="swap-horizontal"
                    size={22}
                    color={Colors.primary}
                  />
                  <Text style={styles.headerTitle}>Đổi tài khoản</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color={Colors.outline} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Quản lý và chuyển đổi nhanh giữa các tài khoản hội viên trên thiết bị này.
              </Text>

              {/* Current Active Account */}
              {user && (
                <View style={styles.currentAccountCard}>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>Đang đăng nhập</Text>
                  </View>
                  <View style={styles.accountRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(user.userName || "U").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>
                        {user.personalProfile
                          ? `${user.personalProfile.lastName} ${user.personalProfile.firstName}`.trim()
                          : user.userName}
                      </Text>
                      <Text style={styles.accountHandle}>@{user.userName}</Text>
                      <Text style={styles.accountEmail} numberOfLines={1}>
                        {user.email}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Other Saved Accounts */}
              {otherAccounts.length > 0 && (
                <View style={styles.savedSection}>
                  <Text style={styles.sectionLabel}>Tài khoản đã lưu khác</Text>
                  <FlatList
                    data={otherAccounts}
                    keyExtractor={(item) => item.id || item.userName}
                    showsVerticalScrollIndicator={false}
                    style={styles.list}
                    renderItem={({ item }) => (
                      <View style={styles.savedAccountItem}>
                        <TouchableOpacity
                          style={styles.savedAccountMain}
                          onPress={() => handleSwitchToSaved(item)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.savedAvatar}>
                            <Text style={styles.savedAvatarText}>
                              {(item.userName || "U").slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.savedInfo}>
                            <Text style={styles.savedName}>
                              {item.fullName || item.userName}
                            </Text>
                            <Text style={styles.savedHandle}>
                              @{item.userName}
                            </Text>
                            <Text style={styles.savedEmail} numberOfLines={1}>
                              {item.email}
                            </Text>
                          </View>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={Colors.primary}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleRemoveSaved(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color={Colors.outline}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              )}

              {/* Add / Sign in to another account */}
              <TouchableOpacity
                style={styles.addAccountBtn}
                onPress={handleAddNew}
                activeOpacity={0.85}
              >
                <View style={styles.addIconWrap}>
                  <Ionicons name="add" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.addAccountText}>
                  Đăng nhập bằng tài khoản khác
                </Text>
              </TouchableOpacity>
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
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  currentAccountCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
    marginBottom: Spacing.md,
    position: "relative",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-end",
    backgroundColor: "rgba(46, 125, 50, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginBottom: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.onPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  accountHandle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  accountEmail: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
    marginTop: 2,
  },
  savedSection: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.labelSm,
    color: Colors.outline,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  list: {
    maxHeight: 180,
  },
  savedAccountItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF7F2",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    marginBottom: 6,
  },
  savedAccountMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  savedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  savedAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  savedInfo: {
    flex: 1,
  },
  savedName: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  savedHandle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  savedEmail: {
    fontSize: 10,
    color: Colors.outline,
  },
  deleteBtn: {
    padding: 8,
  },
  addAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(126, 37, 22, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(126, 37, 22, 0.2)",
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    paddingVertical: 12,
  },
  addIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(126, 37, 22, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  addAccountText: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "700",
  },
});

export default SwitchAccountModal;
