import { useState, useCallback, useEffect } from "react";
import * as Location from "expo-location";
import { OptimalBranchResponse } from "../types/Branch";
import { fetchOptimalBranch } from "../api/branchApi";
import { saveSelectedBranchId } from "../utils/branchStorage";

export interface UserCoordinate {
  latitude: number;
  longitude: number;
  address?: string;
}

export function useOptimalBranch(autoLocate: boolean = false) {
  const [userLocation, setUserLocation] = useState<UserCoordinate | null>(null);
  const [optimalData, setOptimalData] = useState<OptimalBranchResponse | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [isLoadingOptimal, setIsLoadingOptimal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  // Request location permission and get current coordinates
  const getCurrentLocation = useCallback(async (): Promise<UserCoordinate | null> => {
    try {
      setIsLoadingLocation(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(granted);

      if (!granted) {
        // Fallback default: Hanoi center (Hoan Kiem) if user denies permission
        const fallback: UserCoordinate = {
          latitude: 21.028511,
          longitude: 105.854167,
          address: "Trung tâm TP. Hà Nội (Vị trí mặc định)",
        };
        setUserLocation(fallback);
        return fallback;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: UserCoordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Reverse geocode to get human-readable street/city
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        if (geo) {
          const parts = [
            geo.streetNumber,
            geo.street,
            geo.district || geo.subregion,
            geo.city || geo.region,
          ].filter(Boolean);
          coords.address = parts.join(", ") || "Vị trí hiện tại của quý khách";
        }
      } catch {
        coords.address = "Vị trí GPS hiện tại";
      }

      setUserLocation(coords);
      return coords;
    } catch (err: any) {
      console.warn("Failed to get location:", err);
      // Fallback
      const fallback: UserCoordinate = {
        latitude: 21.028511,
        longitude: 105.854167,
        address: "Trung tâm TP. Hà Nội",
      };
      setUserLocation(fallback);
      return fallback;
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  // Calculate optimal branch for given coordinates
  const calculateForCoords = useCallback(
    async (latitude: number, longitude: number, maxRadiusKm: number = 15.0) => {
      try {
        setIsLoadingOptimal(true);
        setError(null);

        const res = await fetchOptimalBranch(latitude, longitude, maxRadiusKm);
        if (res.isSucceed && res.data) {
          setOptimalData(res.data);
          // Auto-save the optimal branch as default branch
          if (res.data.branch?.id) {
            await saveSelectedBranchId(res.data.branch.id);
          }
          return res.data;
        } else {
          setError(res.message || "Không thể tìm thấy chi nhánh tối ưu.");
          return null;
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Có lỗi xảy ra khi tính toán chi nhánh tối ưu.";
        setError(msg);
        return null;
      } finally {
        setIsLoadingOptimal(false);
      }
    },
    [],
  );

  // Full flow: locate then calculate optimal branch
  const locateAndCalculate = useCallback(async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      await calculateForCoords(loc.latitude, loc.longitude);
    }
  }, [getCurrentLocation, calculateForCoords]);

  useEffect(() => {
    if (autoLocate) {
      locateAndCalculate();
    }
  }, [autoLocate, locateAndCalculate]);

  return {
    userLocation,
    optimalData,
    isLoadingLocation,
    isLoadingOptimal,
    isLoading: isLoadingLocation || isLoadingOptimal,
    error,
    hasLocationPermission,
    locateAndCalculate,
    calculateForCoords,
    setUserLocation,
  };
}
