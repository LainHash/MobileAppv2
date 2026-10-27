import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/navigation/types";
import {
  useOptimalBranch,
  BranchRouteMapView,
  saveSelectedBranchId,
  Branch,
  NearbyBranchItem,
} from "@/features/territory/branches";
import { HauteTopBar } from "@/common/components/HauteTopBar";
import { HauteBottomBar } from "@/common/components/HauteBottomBar";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

type OptimalBranchScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OptimalBranch"
>;

export default function OptimalBranchScreen() {
  const navigation = useNavigation<OptimalBranchScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const {
    userLocation,
    optimalData,
    isLoading,
    error,
    locateAndCalculate,
  } = useOptimalBranch(true);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (optimalData?.branch) {
      setSelectedBranch(optimalData.branch);
    }
  }, [optimalData]);

  const handleSelectBranchForOrder = async (b: Branch) => {
    await saveSelectedBranchId(b.id);
    Alert.alert(
      "Đã chọn chi nhánh",
      `Quý khách đã chọn chi nhánh "${b.city || b.branchCode}" làm điểm phục vụ.`,
      [
        {
          text: "Xem Thực Đơn",
          onPress: () => navigation.navigate("Menu", { branchId: b.id }),
        },
        {
          text: "Đặt Bàn Ngay",
          onPress: () =>
            navigation.navigate("Reservation", { branchId: b.id }),
        },
        { text: "Đóng", style: "cancel" },
      ],
    );
  };

  const handleSelectBranchForReservation = async (b: Branch) => {
    await saveSelectedBranchId(b.id);
    navigation.navigate("Reservation", { branchId: b.id });
  };

  const activeBranch = selectedBranch || optimalData?.branch;

  return (
    <View style={styles.screenWrapper}>
      <HauteTopBar
        title="Haute De Hallen"
        subtitle="CHI NHÁNH & BẢN ĐỒ LỘ TRÌNH"
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
        {/* GPS Location Bar */}
        <View style={styles.locationBarCard}>
          <View style={styles.locationIconWrap}>
            <Ionicons name="navigate" size={18} color={Colors.primary} />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationBarLabel}>Vị trí khách hàng:</Text>
            <Text style={styles.locationBarValue} numberOfLines={2}>
              {userLocation?.address ||
                (userLocation
                  ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                  : "Đang định vị tọa độ GPS...")}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.reLocateBtn}
            onPress={() => locateAndCalculate()}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="refresh" size={18} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Error Notice */}
        {Boolean(error) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Interactive Google Map with Route & Pins */}
        <View style={styles.mapSection}>
          <BranchRouteMapView
            userLocation={userLocation}
            optimalData={optimalData}
            selectedBranch={activeBranch}
            onSelectBranch={(b) => setSelectedBranch(b)}
          />
        </View>

        {/* Optimal Branch Spotlight Card */}
        {activeBranch && (
          <View style={styles.spotlightCard}>
            <View style={styles.spotlightHeader}>
              <View style={styles.badgeWrap}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>CHI NHÁNH TỐI ƯU NHẤT</Text>
              </View>
              <View style={styles.openPill}>
                <View
                  style={[
                    styles.openDot,
                    optimalData?.isOpenNow
                      ? styles.openDotActive
                      : styles.openDotInactive,
                  ]}
                />
                <Text style={styles.openPillText}>
                  {optimalData?.isOpenNow ? "Đang mở cửa" : "Tạm đóng cửa"}
                </Text>
              </View>
            </View>

            <Text style={styles.spotlightTitle}>
              {activeBranch.city || "Haute De Hallen"}
            </Text>
            <Text style={styles.spotlightCode}>
              Mã chi nhánh: #{activeBranch.branchCode}
            </Text>
            <Text style={styles.spotlightAddress}>
              {activeBranch.address}
            </Text>

            {/* Metrics Breakdown */}
            {optimalData && (
              <View style={styles.metricsBox}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricColValue}>
                    {optimalData.distanceKm} km
                  </Text>
                  <Text style={styles.metricColLabel}>Khoảng cách</Text>
                </View>
                <View style={styles.metricColBorder} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricColValue}>
                    ~{optimalData.estimatedDeliveryMinutes} phút
                  </Text>
                  <Text style={styles.metricColLabel}>Giao hàng ước tính</Text>
                </View>
                <View style={styles.metricColBorder} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricColValue}>
                    {Number(
                      optimalData.estimatedDeliveryFee || 0,
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </Text>
                  <Text style={styles.metricColLabel}>Phí vận chuyển</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => handleSelectBranchForOrder(activeBranch)}
                activeOpacity={0.85}
              >
                <Ionicons name="cart" size={16} color={Colors.onPrimary} />
                <Text style={styles.primaryActionText}>
                  Chọn đặt món giao tận nơi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() =>
                  handleSelectBranchForReservation(activeBranch)
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name="calendar"
                  size={16}
                  color={Colors.secondary}
                />
                <Text style={styles.secondaryActionText}>
                  Đặt bàn tiệc tại đây
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Other Nearby Branches List */}
        {optimalData?.nearbyBranches &&
          optimalData.nearbyBranches.length > 0 && (
            <View style={styles.nearbySection}>
              <Text style={styles.nearbySectionTitle}>
                Các chi nhánh lân cận khác
              </Text>
              {optimalData.nearbyBranches.map((item: NearbyBranchItem) => (
                <TouchableOpacity
                  key={item.branch.id}
                  style={[
                    styles.nearbyCard,
                    activeBranch?.id === item.branch.id &&
                      styles.nearbyCardSelected,
                  ]}
                  onPress={() => setSelectedBranch(item.branch)}
                  activeOpacity={0.8}
                >
                  <View style={styles.nearbyIconCircle}>
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.nearbyDetails}>
                    <Text style={styles.nearbyName}>
                      {item.branch.city || item.branch.branchCode}
                    </Text>
                    <Text style={styles.nearbyAddress} numberOfLines={1}>
                      {item.branch.address}
                    </Text>
                    <View style={styles.nearbyFooter}>
                      <Text style={styles.nearbyDistance}>
                        Cách {item.distanceKm} km
                      </Text>
                      <Text style={styles.nearbyDot}>•</Text>
                      <Text style={styles.nearbyTime}>
                        ~{item.estimatedDeliveryMinutes} phút
                      </Text>
                      <Text style={styles.nearbyDot}>•</Text>
                      <Text
                        style={[
                          styles.nearbyStatus,
                          item.isOpenNow
                            ? styles.statusOpen
                            : styles.statusClosed,
                        ]}
                      >
                        {item.isOpenNow ? "Đang mở cửa" : "Đã đóng"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={
                      activeBranch?.id === item.branch.id
                        ? "checkmark-circle"
                        : "chevron-forward"
                    }
                    size={20}
                    color={
                      activeBranch?.id === item.branch.id
                        ? Colors.primary
                        : Colors.outline
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
      </ScrollView>

      <HauteBottomBar activeTab="Home" />
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
  locationBarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(126, 37, 22, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTextWrap: {
    flex: 1,
  },
  locationBarLabel: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.outline,
    textTransform: "uppercase",
  },
  locationBarValue: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: "600",
    marginTop: 1,
  },
  reLocateBtn: {
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.onErrorContainer,
    flex: 1,
  },
  mapSection: {
    marginBottom: Spacing.md,
  },
  spotlightCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  spotlightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openDotActive: {
    backgroundColor: Colors.success,
  },
  openDotInactive: {
    backgroundColor: Colors.error,
  },
  openPillText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: "600",
  },
  spotlightTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 4,
  },
  spotlightCode: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
    marginTop: 1,
  },
  spotlightAddress: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  metricsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    marginVertical: Spacing.md,
  },
  metricCol: {
    flex: 1,
    alignItems: "center",
  },
  metricColValue: {
    ...Typography.labelMd,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "800",
  },
  metricColLabel: {
    fontSize: 10,
    color: Colors.outline,
    marginTop: 2,
    textAlign: "center",
  },
  metricColBorder: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderSoft,
  },
  actionGrid: {
    gap: Spacing.xs,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  primaryActionText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
    fontWeight: "700",
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(123, 89, 2, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(196, 154, 69, 0.3)",
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  secondaryActionText: {
    ...Typography.labelMd,
    color: Colors.secondary,
    fontWeight: "700",
  },
  nearbySection: {
    marginBottom: Spacing.md,
  },
  nearbySectionTitle: {
    ...Typography.labelMd,
    color: Colors.outline,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  nearbyCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(126, 37, 22, 0.03)",
  },
  nearbyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(126, 37, 22, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyDetails: {
    flex: 1,
  },
  nearbyName: {
    ...Typography.labelMd,
    fontWeight: "700",
    color: Colors.onSurface,
  },
  nearbyAddress: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  nearbyFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  nearbyDistance: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.secondary,
  },
  nearbyDot: {
    fontSize: 10,
    color: Colors.outline,
  },
  nearbyTime: {
    fontSize: 11,
    color: Colors.outline,
  },
  nearbyStatus: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusOpen: {
    color: Colors.success,
  },
  statusClosed: {
    color: Colors.error,
  },
});
