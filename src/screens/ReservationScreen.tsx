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
import { RootStackParamList } from "@/navigation/types";
import {
  useBranches,
  BranchDropdown,
  getSelectedBranchId,
  saveSelectedBranchId,
} from "@/features/territory/branches";
import { useTables } from "@/features/territory/tables";
import {
  PartySizeStepper,
  DateTimeSelector,
  TableSelectorModal,
  createReservation,
  CreateReservationRequest,
} from "@/features/schedule/reservations";
import { useAuthContext, User } from "@/features/auth";

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
  const { user, isAuthenticated } = useAuthContext();

  const {
    branches,
    isLoading: isBranchesLoading,
    error: branchesError,
  } = useBranches();

  // Branch state
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

  const handleSelectBranch = (bId: string | null) => {
    setSelectedBranchId(bId);
    if (bId) saveSelectedBranchId(bId);
    setSelectedTableIds([]); // reset tables when branch changes
  };

  // Date & Time state
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState<string | null>("18:00");

  // Party size state
  const [partySize, setPartySize] = useState<number>(2);

  // Table selection state
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const { tables, isLoading: isTablesLoading } = useTables(activeBranchId);

  const handleToggleTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId],
    );
  };

  // Contact info state
  const [contactName, setContactName] = useState<string>(
    getUserFullName(user),
  );
  const [contactPhone, setContactPhone] = useState<string>(
    getUserPhone(user),
  );
  const [contactEmail, setContactEmail] = useState<string>(
    user?.email || "",
  );
  const [specialRequests, setSpecialRequests] = useState<string>("");

  // Sync auth profile into contact info if available
  useEffect(() => {
    if (user) {
      const name = getUserFullName(user);
      const phone = getUserPhone(user);
      setContactName((prev) => prev || name);
      setContactPhone((prev) => prev || phone);
      setContactEmail((prev) => prev || user.email || "");
    }
  }, [user]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Combine date & time into UTC ISO string
    const [h, m] = selectedTime.split(":").map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(h, m, 0, 0);

    const reservedFromIso = bookingDate.toISOString();
    const reservedToDate = new Date(bookingDate.getTime() + 2 * 60 * 60 * 1000);
    const reservedToIso = reservedToDate.toISOString();

    const payload: CreateReservationRequest = {
      branchId: activeBranchId,
      reservedFrom: reservedFromIso,
      reservedTo: reservedToIso,
      partySize,
      contactName: contactName.trim(),
      contactPhone: cleanPhone,
      contactEmail: contactEmail.trim() || undefined,
      specialRequests: specialRequests.trim() || undefined,
      tableIds: selectedTableIds.length > 0 ? selectedTableIds : undefined,
    };

    try {
      setIsSubmitting(true);
      const res = await createReservation(payload);

      if (res.isSucceed && res.data) {
        navigation.replace("ReservationSuccess", {
          reservationId: res.data.id,
          reservationCode: res.data.reservationCode,
          branchName: currentBranch?.branchCode || currentBranch?.city || "Nhà hàng",
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

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Chọn Chi nhánh */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 1. Chi nhánh phục vụ</Text>
          {isBranchesLoading ? (
            <ActivityIndicator size="small" style={{ marginVertical: 10 }} />
          ) : branchesError ? (
            <Text style={styles.errorText}>{branchesError}</Text>
          ) : (
            <BranchDropdown
              branches={branches}
              value={activeBranchId}
              onSelect={handleSelectBranch}
              placeholder="Chọn chi nhánh"
              hideAllOption
            />
          )}

          {currentBranch && (
            <View style={styles.branchInfoBox}>
              <Text style={styles.branchAddress}>
                🏢 {currentBranch.address}, {currentBranch.city}
              </Text>
              <Text style={styles.branchHours}>
                ⏰ Giờ mở cửa: {currentBranch.openTime?.slice(0, 5) || "08:00"} -{" "}
                {currentBranch.closeTime?.slice(0, 5) || "22:00"}
              </Text>
              {Boolean(currentBranch.phoneNumber) && (
                <Text style={styles.branchPhone}>
                  📞 Hotline: {currentBranch.phoneNumber}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 2. Thời gian & Số lượng khách */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 2. Thời gian & Số lượng khách</Text>
          <DateTimeSelector
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            openTime={currentBranch?.openTime || "08:00"}
            closeTime={currentBranch?.closeTime || "22:00"}
          />

          <View style={styles.divider} />

          <Text style={styles.subSectionTitle}>Số lượng khách</Text>
          <PartySizeStepper value={partySize} onChange={setPartySize} />
        </View>

        {/* 3. Tùy chọn Bàn */}
        <View style={styles.card}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.cardTitle}>🪑 3. Vị trí bàn</Text>
            <TouchableOpacity
              style={styles.chooseTableButton}
              onPress={() => setIsTableModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.chooseTableButtonText}>
                {selectedTableIds.length > 0 ? "Đổi bàn" : "Tự chọn bàn cụ thể"}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedTableIds.length === 0 ? (
            <View style={styles.autoAssignBox}>
              <Text style={styles.autoAssignText}>
                ✨ Mặc định: Nhà hàng sẽ tự động sắp xếp bàn phù hợp và thuận tiện nhất cho đoàn {partySize} khách của bạn khi đến.
              </Text>
            </View>
          ) : (
            <View style={styles.selectedTablesContainer}>
              <Text style={styles.selectedTablesLabel}>Bàn đã chọn:</Text>
              <View style={styles.tableChipsWrap}>
                {selectedTableIds.map((id) => {
                  const t = tables.find((item) => item.id === id);
                  return (
                    <View key={id} style={styles.tableChip}>
                      <Text style={styles.tableChipText}>
                        Bàn {t?.tableNumber || "N/A"} ({t?.capacity || 2} người)
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleToggleTable(id)}
                        style={styles.tableChipRemove}
                      >
                        <Text style={styles.tableChipRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* 4. Thông tin liên hệ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 4. Thông tin người đặt bàn</Text>
          {!isAuthenticated && (
            <Text style={styles.guestNotice}>
              💡 Bạn đang đặt bàn với tư cách khách vãng lai. Vui lòng điền đủ họ tên và số điện thoại.
            </Text>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Họ và tên <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nguyễn Văn A"
              value={contactName}
              onChangeText={setContactName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Số điện thoại <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0912 345 678"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Địa chỉ Email (nhận xác nhận)</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Ghi chú / Yêu cầu đặc biệt</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ví dụ: Cần ghế trẻ em, kỷ niệm ngày cưới, bàn yên tĩnh..."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Nút Đặt bàn */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              Xác nhận Đặt bàn ({partySize} khách • {selectedTime})
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal chọn bàn */}
      <TableSelectorModal
        visible={isTableModalVisible}
        onClose={() => setIsTableModalVisible(false)}
        tables={tables}
        selectedTableIds={selectedTableIds}
        onToggleTable={handleToggleTable}
        isLoading={isTablesLoading}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginTop: 10,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  branchInfoBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    gap: 4,
  },
  branchAddress: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  branchHours: {
    fontSize: 12,
    color: "#64748B",
  },
  branchPhone: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "600",
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chooseTableButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chooseTableButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  autoAssignBox: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  autoAssignText: {
    fontSize: 13,
    color: "#166534",
    lineHeight: 18,
  },
  selectedTablesContainer: {
    marginTop: 8,
  },
  selectedTablesLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  tableChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tableChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 6,
  },
  tableChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  tableChipRemove: {
    padding: 2,
  },
  tableChipRemoveText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "700",
  },
  guestNotice: {
    fontSize: 12,
    color: "#D97706",
    backgroundColor: "#FEF3C7",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorText: {
    color: "red",
    fontSize: 13,
  },
});
