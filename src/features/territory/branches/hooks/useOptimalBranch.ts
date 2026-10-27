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

      // Check if location services (GPS) are enabled on device
      const isServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!isServicesEnabled) {
        console.warn("Location services (GPS) are disabled on this device.");
      }

      // Check / request foreground permission
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      const granted = status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(granted);

      if (!granted) {
        setError("Chưa cấp quyền truy cập vị trí.");
        const fallback: UserCoordinate = {
          latitude: 10.9844,
          longitude: 106.8687,
          address: "Biên Hòa / TP. Hồ Chí Minh (Vị trí mặc định)",
        };
        setUserLocation(fallback);
        return fallback;
      }

      // Resilient position fetching:
      // On Android / Emulators, Accuracy.High or getLastKnownPositionAsync succeeds reliably
      let position: Location.LocationObject | null = null;

      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch (highErr) {
        try {
          position = await Location.getLastKnownPositionAsync({});
        } catch (lastErr) {
          // ignore
        }

        if (!position) {
          try {
            position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
          } catch (balancedErr) {
            try {
              position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Lowest,
              });
            } catch (lowestErr) {
              console.warn("All position accuracy attempts failed:", lowestErr);
            }
          }
        }
      }

      if (!position) {
        throw new Error(
          "Không thể nhận diện vị trí GPS. Hãy chắc chắn đã bật vị trí và bấm 'Set Location' trên trình giả lập.",
        );
      }

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
          coords.address =
            parts.join(", ") ||
            `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        }
      } catch {
        coords.address = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      }

      setUserLocation(coords);
      return coords;
    } catch (err: any) {
      console.warn("Failed to get location:", err);
      setError(
        err?.message ||
          "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS và thử lại.",
      );
      // Fallback
      const fallback: UserCoordinate = {
        latitude: 10.9844,
        longitude: 106.8687,
        address: "Biên Hòa / TP. Hồ Chí Minh (Vị trí mặc định)",
      };
      setUserLocation(fallback);
      return fallback;
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  // Calculate optimal branch for given coordinates
  const calculateForCoords = useCallback(
    async (
      latitude: number,
      longitude: number,
      maxRadiusKm: number = 15.0,
      targetBranchId?: string | null,
      autoSaveBranch: boolean = true,
    ) => {
      try {
        setIsLoadingOptimal(true);
        setError(null);

        const res = await fetchOptimalBranch(
          latitude,
          longitude,
          maxRadiusKm,
          targetBranchId,
        );
        if (res.isSucceed && res.data) {
          setOptimalData(res.data);
          // Auto-save the optimal branch as default branch if allowed
          if (autoSaveBranch && res.data.branch?.id) {
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
  const locateAndCalculate = useCallback(
    async (targetBranchId?: any, autoSaveBranch: boolean = true) => {
      const branchIdStr =
        typeof targetBranchId === "string" ? targetBranchId : null;
      const shouldSave =
        typeof autoSaveBranch === "boolean" ? autoSaveBranch : true;
      const loc = await getCurrentLocation();
      if (loc) {
        return await calculateForCoords(
          loc.latitude,
          loc.longitude,
          15.0,
          branchIdStr,
          shouldSave,
        );
      }
      return null;
    },
    [getCurrentLocation, calculateForCoords],
  );

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
