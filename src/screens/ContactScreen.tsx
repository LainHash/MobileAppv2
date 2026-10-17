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
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/navigation/types";
import { ContactForm } from "@/features/contact";
import {
  useBranches,
  Branch,
  BranchDropdown,
  getSelectedBranchId,
  saveSelectedBranchId,
} from "@/features/territory/branches";

type ContactScreenRouteProp = RouteProp<RootStackParamList, "Contact">;

export default function ContactScreen() {
  const route = useRoute<ContactScreenRouteProp>();
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
          ios: "maps:0,0?q=Restaurant",
          android: "geo:0,0?q=Restaurant",
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
      return { text: "Đang hoạt động", color: "#16A34A", bg: "#DCFCE7" };
    }
    if (s === "closed") {
      return { text: "Tạm đóng cửa", color: "#DC2626", bg: "#FEE2E2" };
    }
    if (s === "undermaintenance") {
      return { text: "Đang bảo trì", color: "#D97706", bg: "#FEF3C7" };
    }
    if (s === "inactive") {
      return { text: "Ngưng hoạt động", color: "#64748B", bg: "#F1F5F9" };
    }
    return { text: status, color: "#4F46E5", bg: "#EEF2FF" };
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
              📍 {item.address}
            </Text>
          )}
        </View>
        {isSelected && <Text style={styles.dropdownCheck}>✓</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <Text style={styles.headerTag}>TRUNG TÂM HỖ TRỢ</Text>
            <Text style={styles.headerTitle}>
              Chúng tôi luôn sẵn sàng lắng nghe bạn
            </Text>
            <Text style={styles.headerDescription}>
              Mọi đóng góp, câu hỏi hoặc yêu cầu đặt tiệc của quý khách đều là
              động lực để chúng tôi hoàn thiện mỗi ngày.
            </Text>
          </View>

          {/* Branch Selection Card */}
          <View style={styles.branchSelectCard}>
            <View style={styles.branchSelectHeader}>
              <View style={styles.branchSelectHeaderLeft}>
                <Text style={styles.branchSelectTitle}>
                  🏢 Chi nhánh liên hệ
                </Text>
                <Text style={styles.branchSelectSubtitle}>
                  Xem thông tin hotline và địa chỉ theo chi nhánh
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
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.branchLoadingText}>
                  Đang tải danh sách chi nhánh...
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
                  Không thể tải danh sách chi nhánh
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={refreshBranches}
                >
                  <Text style={styles.retryBtnText}>Thử lại ↻</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Quick Channels Grid */}
          <View style={styles.quickChannelsContainer}>
            <TouchableOpacity
              style={styles.channelCard}
              onPress={handleCallHotline}
              activeOpacity={0.7}
            >
              <View
                style={[styles.channelIconBox, { backgroundColor: "#FEF3C7" }]}
              >
                <Text style={styles.channelIcon}>📞</Text>
              </View>
              <Text style={styles.channelTitle}>Hotline đặt bàn</Text>
              <Text style={styles.channelValue} numberOfLines={1}>
                {currentBranch?.phoneNumber || "1900 8888"}
              </Text>
              <Text style={styles.channelAction}>Nhấn để gọi ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.channelCard}
              onPress={handleSendEmail}
              activeOpacity={0.7}
            >
              <View
                style={[styles.channelIconBox, { backgroundColor: "#DBEAFE" }]}
              >
                <Text style={styles.channelIcon}>✉️</Text>
              </View>
              <Text style={styles.channelTitle}>Hòm thư hỗ trợ</Text>
              <Text style={styles.channelValue} numberOfLines={1}>
                {currentBranch?.email || "support@res.vn"}
              </Text>
              <Text style={styles.channelAction}>Gửi email ➔</Text>
            </TouchableOpacity>
          </View>

          {/* Office Hours & Address Bar */}
          <View style={styles.infoBar}>
            <View style={styles.infoBarItem}>
              <Text style={styles.infoBarIcon}>⏰</Text>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoBarLabel}>Thời gian hoạt động</Text>
                <Text style={styles.infoBarValue}>{formattedHours}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.infoBarItem, styles.addressItem]}
              onPress={handleOpenMap}
              activeOpacity={0.7}
            >
              <Text style={styles.infoBarIcon}>📍</Text>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoBarLabel}>
                  {currentBranch
                    ? `Chi nhánh ${currentBranch.city || currentBranch.branchCode}`
                    : "Hệ thống chi nhánh"}
                </Text>
                <Text style={styles.infoBarValue} numberOfLines={2}>
                  {currentBranch?.address
                    ? `${currentBranch.address}${currentBranch.city ? `, ${currentBranch.city}` : ""}`
                    : "Xem địa chỉ trên bản đồ"}
                </Text>
                <Text style={styles.mapHintText}>
                  Chạm để mở bản đồ & chỉ đường ›
                </Text>
              </View>
              <Text style={styles.arrowIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          <ContactForm />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 540,
    alignSelf: "center",
  },
  headerBanner: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#818CF8",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 28,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 13,
    color: "#C7D2FE",
    lineHeight: 20,
  },
  branchSelectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  branchSelectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  branchSelectHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  branchSelectTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  branchSelectSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  branchDropdown: {
    margin: 0,
    marginTop: 4,
    height: 48,
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  dropdownItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemSelectedRow: {
    backgroundColor: "#EEF2FF",
  },
  dropdownItemTextCol: {
    flex: 1,
  },
  dropdownItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  dropdownItemTitleSelected: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  codeBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4338CA",
  },
  dropdownItemSub: {
    fontSize: 12,
    color: "#64748B",
  },
  dropdownCheck: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "700",
    marginLeft: 8,
  },
  branchLoadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  branchLoadingText: {
    fontSize: 13,
    color: "#64748B",
  },
  branchErrorBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  branchErrorText: {
    fontSize: 12,
    color: "#DC2626",
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
  quickChannelsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  channelCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  channelIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  channelIcon: {
    fontSize: 18,
  },
  channelTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 4,
  },
  channelValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  channelAction: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
  infoBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  infoBarItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoTextWrapper: {
    flex: 1,
  },
  addressItem: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  infoBarIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  infoBarLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  infoBarValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 18,
  },
  mapHintText: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "500",
    marginTop: 4,
  },
  arrowIcon: {
    fontSize: 20,
    color: "#94A3B8",
    fontWeight: "700",
    alignSelf: "center",
  },
});
