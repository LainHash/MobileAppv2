import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import {
  useBranches,
  Branch,
  getSelectedBranchId,
  saveSelectedBranchId,
} from "@/features/territory/branches";
import { useAreas } from "@/features/territory/areas";
import { useTables } from "@/features/territory/tables";
import {
  DateTimeSelector,
  PartySizeStepper,
  TableSelectorModal,
  createReservation,
  CreateReservationRequest,
} from "@/features/schedule/reservations";
import { useAuthContext, User } from "@/features/auth";
import { useCart } from "@/features/commerce/carts";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

function getUserFullName(u: User | null | undefined): string {
  if (!u) return "";
  const name = [u.personalProfile?.lastName, u.personalProfile?.firstName]
    .filter(Boolean)
    .join(" ");
  return name || u.userName || "";
}

function getUserPhone(u: User | null | undefined): string {
  return u?.personalProfile?.phone || "";
}

type ReservationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Reservation"
>;
type ReservationScreenRouteProp = RouteProp<RootStackParamList, "Reservation">;

export default function ReservationScreen() {
  const navigation = useNavigation<ReservationScreenNavigationProp>();
  const route = useRoute<ReservationScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();

  // 1. Fetch branches from territory/branches API
  const {
    branches,
    isLoading: isBranchesLoading,
    error: branchesError,
  } = useBranches();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    route.params?.branchId ?? null,
  );

  useEffect(() => {
    if (!route.params?.branchId) {
      getSelectedBranchId().then((stored) => {
        if (stored) setSelectedBranchId(stored);
      });
    }
  }, [route.params?.branchId]);

  const currentBranch = useMemo(() => {
    if (!branches || branches.length === 0) return null;
    if (selectedBranchId) {
      const found = branches.find((b) => b.id === selectedBranchId);
      if (found) return found;
    }
    return branches[0];
  }, [branches, selectedBranchId]);

  const activeBranchId = currentBranch?.id ?? null;

  // 2. Fetch areas from territory/areas API for the active branch
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const { areas, isLoading: isAreasLoading } = useAreas(activeBranchId);

  // 3. Fetch tables from territory/tables API for the active branch & selected area
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const { tables, isLoading: isTablesLoading } = useTables(
    activeBranchId,
    selectedAreaId,
  );
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);

  // Cart count for top bar
  const { cart } = useCart(activeBranchId);
  const cartTotalQty = useMemo(() => {
    return cart?.cartItems?.reduce((acc, it) => acc + it.quantity, 0) ?? 0;
  }, [cart?.cartItems]);

  // Date & Time state (dynamic from branch open/close hours)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState<string | null>("18:00");
  const [partySize, setPartySize] = useState<number>(2);

  // Contact info (prefilled from real user profile if logged in)
  const [contactName, setContactName] = useState<string>(getUserFullName(user));
  const [contactPhone, setContactPhone] = useState<string>(getUserPhone(user));
  const [contactEmail, setContactEmail] = useState<string>(user?.email || "");
  const [specialRequests, setSpecialRequests] = useState<string>("");

  useEffect(() => {
    if (user) {
      setContactName((prev) => prev || getUserFullName(user));
      setContactPhone((prev) => prev || getUserPhone(user));
      setContactEmail((prev) => prev || user.email || "");
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectBranch = (b: Branch) => {
    setSelectedBranchId(b.id);
    saveSelectedBranchId(b.id);
    setSelectedAreaId(null);
    setSelectedTableIds([]);
  };

  const handleSelectArea = (areaId: string | null) => {
    setSelectedAreaId(areaId);
    setSelectedTableIds([]);
  };

  const handleToggleTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId],
    );
  };

  const handleSubmit = async () => {
    if (!activeBranchId) {
      Alert.alert("Lỗi", "Vui lòng chọn chi nhánh nhà hàng.");
      return;
    }

    if (!selectedTime) {
      Alert.alert("Lỗi", "Vui lòng chọn khung giờ đến.");
      return;
    }

    if (!contactName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên người liên hệ.");
      return;
    }

    if (!contactPhone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại liên hệ.");
      return;
    }

    const cleanPhone = contactPhone.trim();
    if (!/^[0-9+]{9,15}$/.test(cleanPhone)) {
      Alert.alert("Lỗi", "Số điện thoại liên hệ không hợp lệ.");
      return;
    }

    // Build ISO timestamp in Vietnam Time (+07:00)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const [h, m] = selectedTime.split(":").map(Number);
    const hourStr = String(h).padStart(2, "0");
    const minStr = String(m).padStart(2, "0");

    const bookingDate = new Date(`${year}-${month}-${day}T${hourStr}:${minStr}:00+07:00`);
    const reservedFromIso = bookingDate.toISOString();
    const reservedToIso = new Date(bookingDate.getTime() + 2 * 60 * 60 * 1000).toISOString();

    const selectedAreaName = areas.find((a) => a.id === selectedAreaId)?.name;
    const fullSpecialNotes = [
      selectedAreaName ? `Khu vực: ${selectedAreaName}` : "",
      specialRequests.trim(),
    ]
      .filter(Boolean)
      .join(" • ");

    const payload: CreateReservationRequest = {
      branchId: activeBranchId,
      reservedFrom: reservedFromIso,
      reservedTo: reservedToIso,
      partySize,
      contactName: contactName.trim(),
      contactPhone: cleanPhone,
      contactEmail: contactEmail.trim() || undefined,
      specialRequests: fullSpecialNotes || undefined,
      tableIds: selectedTableIds.length > 0 ? selectedTableIds : undefined,
    };

    try {
      setIsSubmitting(true);
      const res = await createReservation(payload);

      if (res.isSucceed && res.data) {
        navigation.replace("ReservationSuccess", {
          reservationId: res.data.id,
          reservationCode: res.data.reservationCode,
          branchName:
            currentBranch?.branchCode || currentBranch?.city || "Haute De Hallen",
          partySize: res.data.partySize,
          reservedFrom: res.data.reservedFrom,
        });
      } else {
        Alert.alert("Không thành công", res.message || "Đặt bàn thất bại.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi gửi yêu cầu đặt bàn.";
      Alert.alert("Lỗi", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAreaObj = areas.find((a) => a.id === selectedAreaId);

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="ĐẶT BÀN & TRẢI NGHIỆM"
        branchName={currentBranch?.branchCode || currentBranch?.city}
        cartCount={cartTotalQty}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.headerHero}>
            <View style={styles.heroSubTag}>
              <Ionicons name="sparkles" size={12} color={Colors.secondary} />
              <Text style={styles.heroSubTagText}>
                Hệ thống đặt bàn trực tuyến
              </Text>
            </View>
            <Text style={styles.heroHeading}>Đặt bàn tiệc & Trải nghiệm</Text>
            <Text style={styles.heroSubHeading}>
              Dữ liệu chi nhánh, khu vực và bàn được cập nhật thời gian thực từ hệ thống nhà hàng.
            </Text>
          </View>

          {/* BƯỚC 1: CHỌN CHI NHÁNH NHÀ HÀNG (API: territory/branches) */}
          <View style={styles.stepSection}>
            <View style={styles.stepTitleRow}>
              <Ionicons name="location" size={18} color={Colors.primaryContainer} />
              <Text style={styles.stepTitle}>1. Chi nhánh nhà hàng</Text>
            </View>

            {isBranchesLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : branchesError ? (
              <Text style={styles.errorText}>{branchesError}</Text>
            ) : (
              <View style={styles.branchesList}>
                {branches.map((b) => {
                  const isSelected = b.id === activeBranchId;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.branchCard,
                        isSelected && styles.branchCardActive,
                      ]}
                      onPress={() => handleSelectBranch(b)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.branchCardHeader}>
                        <Text
                          style={[
                            styles.branchCityTag,
                            isSelected && styles.branchCityTagActive,
                          ]}
                        >
                          {b.city?.toUpperCase() || "HỆ THỐNG"}
                        </Text>
                        <Ionicons
                          name={
                            isSelected
                              ? "checkmark-circle"
                              : "radio-button-off-outline"
                          }
                          size={20}
                          color={
                            isSelected
                              ? Colors.primaryContainer
                              : Colors.outlineVariant
                          }
                        />
                      </View>
                      <Text style={styles.branchName}>
                        {b.branchCode || `Chi nhánh ${b.city}`}
                      </Text>
                      <Text style={styles.branchAddress} numberOfLines={2}>
                        📍 {b.address}, {b.city}
                      </Text>
                      <View style={styles.branchMetaRow}>
                        <Text style={styles.branchHours}>
                          ⏰ {b.openTime?.slice(0, 5) || "08:00"} -{" "}
                          {b.closeTime?.slice(0, 5) || "22:00"}
                        </Text>
                        {Boolean(b.phoneNumber) && (
                          <Text style={styles.branchPhone}>
                            📞 {b.phoneNumber}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* BƯỚC 2: KHU VỰC NHÀ HÀNG (API: territory/areas) */}
          <View style={styles.stepSection}>
            <View style={styles.stepTitleRow}>
              <MaterialCommunityIcons
                name="floor-plan"
                size={18}
                color={Colors.primaryContainer}
              />
              <Text style={styles.stepTitle}>2. Khu vực dùng bữa (Khu vực)</Text>
              {isAreasLoading && (
                <ActivityIndicator size="small" color={Colors.primaryContainer} />
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.areaReel}
            >
              <TouchableOpacity
                style={[
                  styles.areaChip,
                  selectedAreaId === null && styles.areaChipActive,
                ]}
                onPress={() => handleSelectArea(null)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.areaChipText,
                    selectedAreaId === null && styles.areaChipTextActive,
                  ]}
                >
                  Tất cả khu vực
                </Text>
              </TouchableOpacity>

              {areas.map((area) => {
                const isSelected = selectedAreaId === area.id;
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[
                      styles.areaChip,
                      isSelected && styles.areaChipActive,
                    ]}
                    onPress={() => handleSelectArea(area.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.areaChipText,
                        isSelected && styles.areaChipTextActive,
                      ]}
                    >
                      {area.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* BƯỚC 3: BÀN PHỤC VỤ (API: territory/tables) */}
          <View style={styles.stepSection}>
            <View style={styles.stepTitleRow}>
              <MaterialCommunityIcons
                name="table-chair"
                size={18}
                color={Colors.primaryContainer}
              />
              <Text style={styles.stepTitle}>3. Bàn phục vụ</Text>
              {isTablesLoading && (
                <ActivityIndicator size="small" color={Colors.primaryContainer} />
              )}
            </View>

            {selectedTableIds.length === 0 ? (
              <View style={styles.autoAssignBox}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={Colors.primaryContainer}
                />
                <Text style={styles.autoAssignText}>
                  Mặc định: Hệ thống nhà hàng sẽ tự động sắp xếp bàn phù hợp và thuận tiện nhất khi quý khách đến.
                </Text>
              </View>
            ) : (
              <View style={styles.selectedTablesWrap}>
                <Text style={styles.selectedTablesLabel}>
                  Bàn đã chọn ({selectedTableIds.length}):
                </Text>
                <View style={styles.tableChipsRow}>
                  {selectedTableIds.map((id) => {
                    const t = tables.find((item) => item.id === id);
                    return (
                      <View key={id} style={styles.tableChip}>
                        <Text style={styles.tableChipText}>
                          Bàn {t?.tableNumber || "N/A"} ({t?.capacity || 2} chỗ)
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleToggleTable(id)}
                          style={styles.tableChipRemove}
                        >
                          <Ionicons name="close" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.chooseTableBtn}
              onPress={() => setIsTableModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={Colors.primaryContainer}
              />
              <Text style={styles.chooseTableBtnText}>
                {selectedTableIds.length > 0
                  ? "Đổi hoặc chọn thêm bàn cụ thể"
                  : "Chọn bàn cụ thể từ danh sách bàn"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* BƯỚC 4: THỜI GIAN & SỐ LƯỢNG KHÁCH (Dựa trên giờ hoạt động API) */}
          <View style={styles.stepSection}>
            <View style={styles.stepTitleRow}>
              <Ionicons name="calendar" size={18} color={Colors.primaryContainer} />
              <Text style={styles.stepTitle}>4. Thời gian & Số lượng khách</Text>
            </View>

            <DateTimeSelector
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              openTime={currentBranch?.openTime || "08:00"}
              closeTime={currentBranch?.closeTime || "22:00"}
            />

            <View style={styles.stepperWrap}>
              <Text style={styles.stepperLabel}>Số lượng khách:</Text>
              <PartySizeStepper value={partySize} onChange={setPartySize} />
            </View>
          </View>

          {/* BƯỚC 5: THÔNG TIN KHÁCH HÀNG & GHI CHÚ */}
          <View style={styles.stepSection}>
            <View style={styles.stepTitleRow}>
              <Ionicons name="person-circle" size={18} color={Colors.primaryContainer} />
              <Text style={styles.stepTitle}>5. Thông tin người đặt</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Họ và tên <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder="Nhập họ và tên"
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
                value={contactName}
                onChangeText={setContactName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Số điện thoại liên hệ <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (nhận xác nhận)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="email@example.com"
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú / Yêu cầu đặc biệt</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Ví dụ: Cần ghế trẻ em, bàn yên tĩnh, yêu cầu món chay..."
                placeholderTextColor="rgba(138, 114, 109, 0.6)"
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* TÓM TẮT ĐẶT BÀN & NÚT XÁC NHẬN */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryOverline}>TÓM TẮT ĐẶT BÀN</Text>
                <Text style={styles.summaryDateTime}>
                  {selectedTime || "18:00"} • {selectedDate.toLocaleDateString("vi-VN")}
                </Text>
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.summaryBranchText}>
                  {currentBranch?.branchCode || currentBranch?.city || "Chi nhánh"} • {partySize} Khách
                </Text>
                <Text style={styles.summaryZoneText}>
                  {selectedAreaObj ? selectedAreaObj.name : "Tất cả khu vực"}
                </Text>
              </View>
            </View>

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
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Ionicons name="restaurant" size={18} color={Colors.onPrimary} />
                  <Text style={styles.submitBtnText}>Xác nhận đặt bàn</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.reassuranceText}>
              * Yêu cầu đặt bàn sẽ được ghi nhận trực tiếp vào cơ sở dữ liệu nhà hàng.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Table selector modal (API: territory/tables) */}
      <TableSelectorModal
        visible={isTableModalVisible}
        onClose={() => setIsTableModalVisible(false)}
        tables={tables}
        selectedTableIds={selectedTableIds}
        onToggleTable={handleToggleTable}
        isLoading={isTablesLoading}
      />

      {/* Floating Bottom Nav Bar */}
      <HauteBottomBar activeTab="Reservation" cartCount={cartTotalQty} />
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
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Header Hero
  headerHero: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  heroSubTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  heroSubTagText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSecondaryFixed,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroHeading: {
    ...Typography.headlineLg,
    fontSize: 24,
    color: Colors.primary,
    textAlign: "center",
  },
  heroSubHeading: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 320,
    marginTop: 4,
    lineHeight: 18,
  },

  // Step Sections
  stepSection: {
    marginBottom: Spacing.xl,
  },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  stepTitle: {
    ...Typography.labelLg,
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },

  // Branches
  branchesList: {
    gap: Spacing.sm,
  },
  branchCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.subtle,
  },
  branchCardActive: {
    borderColor: Colors.primaryContainer,
    borderWidth: 2,
  },
  branchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  branchCityTag: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: "700",
  },
  branchCityTagActive: {
    color: Colors.primaryContainer,
  },
  branchName: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
    marginTop: 2,
  },
  branchAddress: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  branchMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  branchHours: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
  },
  branchPhone: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.secondaryGold,
    fontWeight: "600",
  },

  // Areas
  areaReel: {
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  areaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  areaChipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  areaChipText: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  areaChipTextActive: {
    color: Colors.onPrimary,
    fontWeight: "700",
  },

  // Tables
  autoAssignBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.xs,
  },
  autoAssignText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.tertiary,
    flex: 1,
    lineHeight: 18,
  },
  selectedTablesWrap: {
    marginBottom: Spacing.sm,
  },
  selectedTablesLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  tableChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tableChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(158, 60, 43, 0.1)",
    borderWidth: 1,
    borderColor: Colors.primaryContainer,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tableChipText: {
    ...Typography.labelSm,
    color: Colors.primaryContainer,
    fontWeight: "600",
  },
  tableChipRemove: {
    padding: 2,
  },
  chooseTableBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  chooseTableBtnText: {
    ...Typography.labelMd,
    color: Colors.primaryContainer,
    fontWeight: "600",
  },

  // Stepper
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderSoft,
  },
  stepperLabel: {
    ...Typography.labelLg,
    color: Colors.onSurface,
  },

  // Inputs
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  required: {
    color: Colors.error,
  },
  inputField: {
    backgroundColor: "#FDFBF7",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: Spacing.md,
    height: 46,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  noteInput: {
    backgroundColor: "#FDFBF7",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    minHeight: 70,
    textAlignVertical: "top",
  },

  // Summary Card & CTA
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.xl,
    ...Shadows.subtle,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.md,
  },
  summaryOverline: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.8,
  },
  summaryDateTime: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summaryBranchText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  summaryZoneText: {
    ...Typography.labelSm,
    fontSize: 12,
    color: Colors.primaryContainer,
    fontWeight: "600",
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: Colors.primaryContainer,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.outline,
  },
  submitBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  reassuranceText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
});
