import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  Callout,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Branch, OptimalBranchResponse, NearbyBranchItem } from "../types/Branch";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/theme";

export interface BranchRouteMapViewProps {
  userLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  optimalData: OptimalBranchResponse | null;
  selectedBranch?: Branch | null;
  onSelectBranch?: (branch: Branch) => void;
  style?: any;
}

export function BranchRouteMapView({
  userLocation,
  optimalData,
  selectedBranch,
  onSelectBranch,
  style,
}: BranchRouteMapViewProps) {
  const mapRef = useRef<MapView>(null);

  const activeBranch = selectedBranch || optimalData?.branch;

  const branchLat = activeBranch ? Number(activeBranch.latitude) : null;
  const branchLng = activeBranch ? Number(activeBranch.longitude) : null;

  const hasValidBranchCoords =
    branchLat !== null &&
    branchLng !== null &&
    !isNaN(branchLat) &&
    !isNaN(branchLng) &&
    branchLat !== 0;

  const hasValidUserCoords =
    userLocation !== null &&
    userLocation.latitude !== undefined &&
    userLocation.longitude !== undefined &&
    !isNaN(userLocation.latitude) &&
    !isNaN(userLocation.longitude) &&
    userLocation.latitude !== 0;

  // Auto fit map view to cover both user location and optimal branch
  useEffect(() => {
    if (mapRef.current && hasValidUserCoords && hasValidBranchCoords) {
      const coords = [
        {
          latitude: userLocation!.latitude,
          longitude: userLocation!.longitude,
        },
        {
          latitude: branchLat!,
          longitude: branchLng!,
        },
      ];

      // Add nearby branches to bounds if available
      if (optimalData?.nearbyBranches) {
        optimalData.nearbyBranches.forEach((nb) => {
          const lat = Number(nb.branch.latitude);
          const lng = Number(nb.branch.longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
            coords.push({ latitude: lat, longitude: lng });
          }
        });
      }

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [userLocation, branchLat, branchLng, optimalData, hasValidUserCoords, hasValidBranchCoords]);

  // Initial region centered on user or branch
  const initialRegion: Region = {
    latitude: userLocation?.latitude || branchLat || 21.028511,
    longitude: userLocation?.longitude || branchLng || 105.854167,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  // Open native Google Maps app for turn-by-turn navigation
  const openExternalDirections = () => {
    if (!hasValidBranchCoords) return;

    const destLabel = encodeURIComponent(
      activeBranch?.city || activeBranch?.branchCode || "Haute De Hallen",
    );

    let url = "";
    if (hasValidUserCoords) {
      url = Platform.select({
        ios: `maps:0,0?saddr=${userLocation!.latitude},${userLocation!.longitude}&daddr=${branchLat},${branchLng}(${destLabel})`,
        android: `google.navigation:q=${branchLat},${branchLng}&mode=d`,
        default: `https://www.google.com/maps/dir/?api=1&origin=${userLocation!.latitude},${userLocation!.longitude}&destination=${branchLat},${branchLng}`,
      }) || `https://www.google.com/maps/dir/?api=1&origin=${userLocation!.latitude},${userLocation!.longitude}&destination=${branchLat},${branchLng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${branchLat},${branchLng}`;
    }

    Linking.openURL(url).catch((err) => {
      console.warn("Failed to open external maps directions:", err);
    });
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={false}
      >
        {/* User Marker */}
        {hasValidUserCoords && (
          <Marker
            coordinate={{
              latitude: userLocation!.latitude,
              longitude: userLocation!.longitude,
            }}
            title="Vị trí của bạn"
            description={userLocation!.address || "Điểm giao nhận / xuất phát"}
          >
            <View style={styles.userMarkerWrap}>
              <View style={styles.userPulseRing} />
              <View style={styles.userMarkerDot}>
                <Ionicons name="person" size={14} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        )}

        {/* Optimal / Selected Branch Marker */}
        {hasValidBranchCoords && (
          <Marker
            coordinate={{
              latitude: branchLat!,
              longitude: branchLng!,
            }}
            title={activeBranch?.city || "Chi nhánh Haute De Hallen"}
            description={activeBranch?.address || ""}
            onPress={() => activeBranch && onSelectBranch?.(activeBranch)}
          >
            <View style={styles.branchMarkerWrap}>
              <View style={styles.branchBadgeTier}>
                <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                <Text style={styles.branchBadgeTierText}>TỐI ƯU</Text>
              </View>
              <View style={styles.branchMarkerPin}>
                <Ionicons name="restaurant" size={16} color={Colors.onPrimary} />
              </View>
              <View style={styles.branchMarkerTip} />
            </View>
            <Callout>
              <View style={styles.calloutCard}>
                <Text style={styles.calloutTitle}>
                  {activeBranch?.city || "Haute De Hallen"}
                </Text>
                <Text style={styles.calloutDesc} numberOfLines={2}>
                  {activeBranch?.address}
                </Text>
                {optimalData && (
                  <Text style={styles.calloutDistance}>
                    Khoảng cách: {optimalData.distanceKm} km (
                    {optimalData.estimatedDeliveryMinutes} phút)
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        )}

        {/* Nearby Alternative Branch Markers */}
        {optimalData?.nearbyBranches?.map((nb: NearbyBranchItem) => {
          const nbLat = Number(nb.branch.latitude);
          const nbLng = Number(nb.branch.longitude);
          if (
            isNaN(nbLat) ||
            isNaN(nbLng) ||
            nbLat === 0 ||
            nb.branch.id === activeBranch?.id
          ) {
            return null;
          }

          return (
            <Marker
              key={nb.branch.id}
              coordinate={{ latitude: nbLat, longitude: nbLng }}
              title={nb.branch.city || "Chi nhánh"}
              description={`Cách ${nb.distanceKm} km`}
              onPress={() => onSelectBranch?.(nb.branch)}
            >
              <View style={styles.nearbyMarkerPin}>
                <Ionicons
                  name="business"
                  size={14}
                  color={Colors.secondaryFixed}
                />
              </View>
            </Marker>
          );
        })}

        {/* Optimal Route Connecting Polyline */}
        {hasValidUserCoords && hasValidBranchCoords && (
          <>
            {/* Soft Shadow Outline Polyline */}
            <Polyline
              coordinates={[
                {
                  latitude: userLocation!.latitude,
                  longitude: userLocation!.longitude,
                },
                {
                  latitude: branchLat!,
                  longitude: branchLng!,
                },
              ]}
              strokeColor="rgba(0, 0, 0, 0.2)"
              strokeWidth={6}
            />
            {/* Primary Cinnabar Route Polyline */}
            <Polyline
              coordinates={[
                {
                  latitude: userLocation!.latitude,
                  longitude: userLocation!.longitude,
                },
                {
                  latitude: branchLat!,
                  longitude: branchLng!,
                },
              ]}
              strokeColor={Colors.primary}
              strokeWidth={4}
              lineDashPattern={[0]}
            />
          </>
        )}
      </MapView>

      {/* Floating Route Summary Overlay */}
      {optimalData && (
        <View style={styles.floatingOverlay}>
          <View style={styles.routeHeaderRow}>
            <View style={styles.routeBranchInfo}>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    optimalData.isOpenNow
                      ? styles.statusDotOpen
                      : styles.statusDotClosed,
                  ]}
                />
                <Text style={styles.statusText}>
                  {optimalData.isOpenNow ? "Đang mở cửa" : "Đã đóng cửa"}
                </Text>
              </View>
              <Text style={styles.branchName} numberOfLines={1}>
                {activeBranch?.city || "Haute De Hallen"}
              </Text>
              <Text style={styles.branchAddress} numberOfLines={1}>
                {activeBranch?.address}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={openExternalDirections}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-circle" size={20} color="#FFFFFF" />
              <Text style={styles.directionsBtnText}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics Pill Grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons
                name="speedometer-outline"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.metricValue}>
                {optimalData.distanceKm} km
              </Text>
              <Text style={styles.metricLabel}>Khoảng cách</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Colors.secondaryGold}
              />
              <Text style={styles.metricValue}>
                ~{optimalData.estimatedDeliveryMinutes} phút
              </Text>
              <Text style={styles.metricLabel}>Thời gian</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons
                name="bicycle-outline"
                size={16}
                color={Colors.success}
              />
              <Text style={styles.metricValue}>
                {Number(optimalData.estimatedDeliveryFee || 0).toLocaleString(
                  "vi-VN",
                )}{" "}
                đ
              </Text>
              <Text style={styles.metricLabel}>Phí ship ước tính</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 380,
    borderRadius: Radius.xl,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  // User Marker
  userMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  userPulseRing: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 104, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 104, 255, 0.4)",
  },
  userMarkerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0068FF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.subtle,
  },
  // Branch Marker
  branchMarkerWrap: {
    alignItems: "center",
  },
  branchBadgeTier: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: Colors.secondaryGold,
  },
  branchBadgeTierText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  branchMarkerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 2,
    borderColor: Colors.secondaryGold,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  branchMarkerTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primaryContainer,
    marginTop: -1,
  },
  // Nearby Markers
  nearbyMarkerPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3A2B27",
    borderWidth: 1.5,
    borderColor: Colors.secondaryGold,
    alignItems: "center",
    justifyContent: "center",
  },
  // Callout
  calloutCard: {
    width: 180,
    padding: Spacing.xs,
  },
  calloutTitle: {
    ...Typography.labelMd,
    color: Colors.primary,
    fontWeight: "700",
  },
  calloutDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  calloutDistance: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: "600",
    marginTop: 4,
  },
  // Floating Overlay
  floatingOverlay: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    ...Shadows.card,
  },
  routeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  routeBranchInfo: {
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOpen: {
    backgroundColor: Colors.success,
  },
  statusDotClosed: {
    backgroundColor: Colors.error,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
  },
  branchName: {
    ...Typography.labelLg,
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
  },
  branchAddress: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...Shadows.subtle,
  },
  directionsBtnText: {
    ...Typography.labelSm,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: Spacing.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: "700",
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9,
    color: Colors.outline,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderSoft,
  },
});

export default BranchRouteMapView;
