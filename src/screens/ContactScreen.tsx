import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import { ContactForm } from "@/features/contact";
import {
  useBranches,
  Branch,
  BranchDropdown,
  getSelectedBranchId,
  saveSelectedBranchId,
} from "@/features/territory/branches";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type ContactScreenRouteProp = RouteProp<RootStackParamList, "Contact">;
type ContactScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Contact"
>;

export default function ContactScreen() {
  const route = useRoute<ContactScreenRouteProp>();
  const navigation = useNavigation<ContactScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const {
    branches,
    isLoading: isBranchesLoading,
    error: branchesError,
    refresh: refreshBranches,
  } = useBranches();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    route.params?.branchId ?? null,
  );

  // Load saved branch id from local storage if not specified in route params
  useEffect(() => {
    let isMounted = true;
    if (!route.params?.branchId) {
      getSelectedBranchId().then((storedId) => {
        if (isMounted && storedId) {
          setSelectedBranchId(storedId);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [route.params?.branchId]);

  // Determine current active branch
  const currentBranch = useMemo(() => {
    if (!branches || branches.length === 0) return null;
    if (selectedBranchId) {
      const found = branches.find((b) => b.id === selectedBranchId);
      if (found) return found;
    }
    return branches[0];
  }, [branches, selectedBranchId]);

  const handleSelectBranch = (branchId: string | null) => {
    setSelectedBranchId(branchId);
    if (branchId) {
      saveSelectedBranchId(branchId);
    }
  };

  const handleCallHotline = () => {
    const rawPhone = currentBranch?.phoneNumber;
    if (!rawPhone || !rawPhone.trim()) {
      Alert.alert("Thông báo", "Chi nhánh hiện chưa có số điện thoại liên hệ.");
      return;
    }
    const cleanNumber = rawPhone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`).catch((err) => {
      console.warn("Failed to open phone call URL", err);
    });
  };

  const handleSendEmail = () => {
    const email = currentBranch?.email?.trim();
    if (!email) {
      Alert.alert("Thông báo", "Chi nhánh hiện chưa có địa chỉ email liên hệ.");
      return;
    }
    Linking.openURL(`mailto:${email}`).catch((err) => {
      console.warn("Failed to open email URL", err);
    });
  };

  const handleOpenMap = () => {
    if (!currentBranch) {
      const defaultUrl =
        Platform.select({
          ios: "maps:0,0?q=Haute+De+Hallen",
          android: "geo:0,0?q=Haute+De+Hallen",
          default: "https://maps.google.com",
        }) || "https://maps.google.com";
      Linking.openURL(defaultUrl);
      return;
    }

    const lat = currentBranch.latitude;
    const lng = currentBranch.longitude;
    const addr = currentBranch.address?.trim();
    const branchName =
      currentBranch.city || currentBranch.branchCode || "Chi nhánh";
    const label = encodeURIComponent(branchName);

    const hasCoords =
      lat !== undefined &&
      lng !== undefined &&
      lat !== null &&
      lng !== null &&
      String(lat).trim() !== "" &&
      String(lng).trim() !== "" &&
      Number(lat) !== 0 &&
      Number(lng) !== 0;

    let url = "";
    if (hasCoords) {
      url =
        Platform.select({
          ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
          android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
          default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else if (addr) {
      const fullQuery = encodeURIComponent(
        `${addr}${currentBranch.city ? `, ${currentBranch.city}` : ""}`,
      );
      url =
        Platform.select({
          ios: `maps:0,0?q=${fullQuery}`,
          android: `geo:0,0?q=${fullQuery}`,
          default: `https://www.google.com/maps/search/?api=1&query=${fullQuery}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${fullQuery}`;
    } else {
      url = "https://maps.google.com";
    }

    Linking.openURL(url).catch((err) => {
      console.warn("Failed to open map URL:", err);
    });
  };

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return "";
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, "0")}:${match[2]}`;
    }
    return timeStr;
  };

  const formattedHours = useMemo(() => {
    if (currentBranch?.openTime && currentBranch?.closeTime) {
      return `${formatTime(currentBranch.openTime)} - ${formatTime(currentBranch.closeTime)} (Hàng ngày)`;
    }
    if (currentBranch?.openTime) {
      return `Mở cửa từ ${formatTime(currentBranch.openTime)}`;
    }
    return "08:00 - 22:00 (Hàng ngày)";
  }, [currentBranch]);

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s === "active") {
      return { text: "Đang mở cửa", color: Colors.secondaryGold, bg: Colors.surfaceContainerLow };
    }
    if (s === "closed") {
      return { text: "Tạm đóng cửa", color: Colors.error, bg: "#FEE2E2" };
    }
    if (s === "undermaintenance") {
      return { text: "Đang bảo trì", color: "#D97706", bg: "#FEF3C7" };
    }
    if (s === "inactive") {
      return { text: "Ngưng hoạt động", color: Colors.outline, bg: Colors.surfaceContainerLow };
    }
    return { text: status, color: Colors.primary, bg: Colors.surfaceContainerLow };
  };

  const statusBadge = getStatusBadge(currentBranch?.status);

  // Custom renderer for branch dropdown items
  const renderBranchItem = (item: Branch) => {
    const isSelected = item.id === currentBranch?.id;
    return (
      <View
        style={[
          styles.dropdownItemRow,
          isSelected && styles.dropdownItemSelectedRow,
        ]}
      >
        <View style={styles.dropdownItemTextCol}>
          <View style={styles.dropdownItemTitleRow}>
            <Text
              style={[
                styles.dropdownItemTitle,
                isSelected && styles.dropdownItemTitleSelected,
              ]}
            >
              {item.city || "Chi nhánh"}
            </Text>
            {Boolean(item.branchCode) && (
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{item.branchCode}</Text>
              </View>
            )}
          </View>
          {Boolean(item.address) && (
            <Text style={styles.dropdownItemSub} numberOfLines={1}>
              {item.address}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark" size={18} color={Colors.primary} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="LIÊN HỆ & GÓP Ý"
        showBack={navigation.canGoBack()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Header Luxury Banner */}
            <View style={styles.headerBanner}>
              <View style={styles.bannerTagRow}>
                <Ionicons name="sparkles" size={12} color={Colors.secondaryFixed} />
                <Text style={styles.headerTag}>CHĂM SÓC KHÁCH HÀNG THƯỢNG HẠNG</Text>
              </View>
              <Text style={styles.headerTitle}>
                Lắng nghe & Đồng hành cùng Quý khách
              </Text>
              <Text style={styles.headerDescription}>
                Mọi đóng góp, ý kiến trải nghiệm ẩm thực hoặc yêu cầu đặt tiệc riêng của quý khách đều là nguồn cảm hứng để Haute De Hallen phụng sự chu đáo hơn.
              </Text>
            </View>

            {/* Optimal Branch & Route Map Banner */}
            <TouchableOpacity
              style={styles.optimalBranchBanner}
              onPress={() => navigation.navigate("OptimalBranch")}
              activeOpacity={0.85}
            >
              <View style={styles.optimalBannerIcon}>
                <Ionicons name="navigate-circle" size={26} color={Colors.primary} />
              </View>
              <View style={styles.optimalBannerContent}>
                <View style={styles.optimalBadgeRow}>
                  <Text style={styles.optimalBadge}>GOOGLE MAPS & GPS</Text>
                </View>
                <Text style={styles.optimalBannerTitle}>
                  Tìm chi nhánh tối ưu & Lộ trình
                </Text>
                <Text style={styles.optimalBannerSubtitle}>
                  Tự động tính chi nhánh gần nhất, khoảng cách & phí vận chuyển
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.secondaryGold} />
            </TouchableOpacity>

            {/* Branch Selection Card */}
            <View style={styles.branchSelectCard}>
              <View style={styles.branchSelectHeader}>
                <View style={styles.branchSelectHeaderLeft}>
                  <Text style={styles.branchSelectTitle}>
                    Chi nhánh phục vụ
                  </Text>
                  <Text style={styles.branchSelectSubtitle}>
                    Hotline & địa chỉ không gian ẩm thực theo chi nhánh
                  </Text>
                </View>
                {statusBadge && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusBadge.bg },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusBadge.color },
                      ]}
                    />
                    <Text
                      style={[styles.statusText, { color: statusBadge.color }]}
                    >
                      {statusBadge.text}
                    </Text>
                  </View>
                )}
              </View>

              {isBranchesLoading && branches.length === 0 ? (
                <View style={styles.branchLoadingBox}>
                  <ActivityIndicator size="small" color={Colors.primaryContainer} />
                  <Text style={styles.branchLoadingText}>
                    Đang kết nối danh sách chi nhánh...
                  </Text>
                </View>
              ) : branches.length > 0 ? (
                <BranchDropdown
                  branches={branches}
                  value={currentBranch?.id ?? null}
                  onSelect={handleSelectBranch}
                  placeholder="Chọn chi nhánh liên hệ"
                  hideAllOption={true}
                  renderItem={renderBranchItem}
                  style={styles.branchDropdown}
                />
              ) : Boolean(branchesError) ? (
                <View style={styles.branchErrorBox}>
                  <Text style={styles.branchErrorText}>
                    Không thể kết nối danh sách chi nhánh
                  </Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={refreshBranches}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.retryBtnText}>Thử lại</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Quick Channels Grid */}
            <View style={styles.quickChannelsContainer}>
              <TouchableOpacity
                style={styles.channelCard}
                onPress={handleCallHotline}
                activeOpacity={0.8}
              >
                <View style={styles.channelIconBox}>
                  <Ionicons name="call" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.channelTitle}>Hotline phục vụ</Text>
                <Text style={styles.channelValue} numberOfLines={1}>
                  {currentBranch?.phoneNumber || "1900 8888"}
                </Text>
                <View style={styles.channelActionRow}>
                  <Text style={styles.channelAction}>Gọi ngay</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.secondaryGold} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelCard}
                onPress={handleSendEmail}
                activeOpacity={0.8}
              >
                <View style={styles.channelIconBox}>
                  <Ionicons name="mail" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.channelTitle}>Hòm thư điện tử</Text>
                <Text style={styles.channelValue} numberOfLines={1}>
                  {currentBranch?.email || "concierge@hautedehallen.vn"}
                </Text>
                <View style={styles.channelActionRow}>
                  <Text style={styles.channelAction}>Gửi email</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.secondaryGold} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Office Hours & Address Bar */}
            <View style={styles.infoBar}>
              <View style={styles.infoBarItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="time-outline" size={18} color={Colors.secondaryGold} />
                </View>
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoBarLabel}>Thời gian mở cửa</Text>
                  <Text style={styles.infoBarValue}>{formattedHours}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.infoBarItem, styles.addressItem]}
                onPress={handleOpenMap}
                activeOpacity={0.7}
              >
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={18} color={Colors.secondaryGold} />
                </View>
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoBarLabel}>
                    {currentBranch
                      ? `Chi nhánh ${currentBranch.city || currentBranch.branchCode}`
                      : "Không gian nhà hàng"}
                  </Text>
                  <Text style={styles.infoBarValue} numberOfLines={2}>
                    {currentBranch?.address
                      ? `${currentBranch.address}${currentBranch.city ? `, ${currentBranch.city}` : ""}`
                      : "Chạm để xem địa chỉ trên bản đồ"}
                  </Text>
                  <Text style={styles.mapHintText}>
                    Chạm để xem bản đồ & chỉ đường ›
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.outline} style={{ alignSelf: "center" }} />
              </TouchableOpacity>
            </View>

            {/* Contact Form */}
            <ContactForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 540,
    alignSelf: "center",
  },
  headerBanner: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
  },
  bannerTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.xs,
  },
  headerTag: {
    ...Typography.labelSm,
    color: Colors.secondaryFixed,
    letterSpacing: 1,
    fontWeight: "700",
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.onPrimary,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  headerDescription: {
    ...Typography.bodySm,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 20,
  },
  optimalBranchBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
    ...Shadows.subtle,
    gap: Spacing.md,
  },
  optimalBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  optimalBannerContent: {
    flex: 1,
  },
  optimalBadgeRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  optimalBadge: {
    ...Typography.labelSm,
    fontSize: 9,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  optimalBannerTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: 2,
  },
  optimalBannerSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
  branchSelectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  branchSelectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  branchSelectHeaderLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  branchSelectTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
  },
  branchSelectSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.labelSm,
    fontSize: 11,
    fontWeight: "600",
  },
  branchDropdown: {
    margin: 0,
    marginTop: 4,
    height: 48,
    backgroundColor: Colors.surfaceContainerLow,
    borderColor: Colors.borderSoft,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  dropdownItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSoft,
  },
  dropdownItemSelectedRow: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  dropdownItemTextCol: {
    flex: 1,
  },
  dropdownItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  dropdownItemTitle: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "600",
  },
  dropdownItemTitleSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  codeBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  codeBadgeText: {
    ...Typography.labelSm,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },
  dropdownItemSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  branchLoadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  branchLoadingText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  branchErrorBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  branchErrorText: {
    ...Typography.bodySm,
    color: Colors.error,
  },
  retryBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: "#FEE2E2",
    borderRadius: Radius.xs,
  },
  retryBtnText: {
    ...Typography.labelSm,
    color: Colors.error,
    fontWeight: "700",
  },
  quickChannelsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  channelCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  channelIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  channelTitle: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  channelValue: {
    ...Typography.titleSm,
    color: Colors.onSurface,
    fontWeight: "700",
    marginBottom: 6,
  },
  channelActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  channelAction: {
    ...Typography.labelSm,
    color: Colors.secondaryGold,
    fontWeight: "700",
  },
  infoBar: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
    gap: Spacing.md,
  },
  infoBarItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  infoTextWrapper: {
    flex: 1,
  },
  addressItem: {
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSoft,
  },
  infoBarLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  infoBarValue: {
    ...Typography.bodyMedium,
    fontWeight: "600",
    color: Colors.onSurface,
    lineHeight: 18,
  },
  mapHintText: {
    ...Typography.labelSm,
    color: Colors.secondaryGold,
    fontWeight: "600",
    marginTop: 4,
  },
});
