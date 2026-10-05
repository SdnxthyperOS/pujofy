import { useState, useEffect, useCallback, useRef } from 'react';
import { KOLKATA_HUBS } from '../services/api';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface LocationState {
  lat: number;
  lng: number;
  name: string;
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface UseLocationReturn {
  location: LocationState;
  permissionState: PermissionState;
  isGPSActive: boolean;
  error: string | null;
  hasMoved: boolean;
  requestGPS: () => void;
  setCustomLocation: (loc: LocationState) => void;
  clearError: () => void;
}

export function useLocation(initialLocation = KOLKATA_HUBS[0]): UseLocationReturn {
  const [location, setLocation] = useState<LocationState>(initialLocation);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [isGPSActive, setIsGPSActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const prevLocationRef = useRef<LocationState>(initialLocation);
  const watchIdRef = useRef<number | null>(null);

  // Check permission state on mount if permissions API is available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            setPermissionState('granted');
          } else if (result.state === 'denied') {
            setPermissionState('denied');
          } else {
            setPermissionState('prompt');
          }

          result.onchange = () => {
            if (result.state === 'granted') setPermissionState('granted');
            if (result.state === 'denied') setPermissionState('denied');
          };
        })
        .catch(() => {
          // Permissions API query not supported or restricted
        });
    }
  }, []);

  const updateLocationWithMovementCheck = useCallback((newLat: number, newLng: number, name: string) => {
    const newLoc = { lat: newLat, lng: newLng, name };
    const dist = calculateDistanceMeters(
      prevLocationRef.current.lat,
      prevLocationRef.current.lng,
      newLat,
      newLng
    );

    if (dist > 100) {
      setHasMoved(true);
      prevLocationRef.current = newLoc;
      setLocation(newLoc);
    } else {
      setHasMoved(false);
    }
  }, []);

  const requestGPS = useCallback(() => {
    setError(null);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setPermissionState('unsupported');
      setError('Browser does not support geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermissionState('granted');
        setIsGPSActive(true);
        const newLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My GPS Location',
        };
        prevLocationRef.current = newLoc;
        setLocation(newLoc);
        setHasMoved(true);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied');
          setError('Location permission denied. Using fallback Puja hub.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out. Using fallback Puja hub.');
        } else {
          setError('Location unavailable. Using fallback Puja hub.');
        }
        setIsGPSActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  // Active watch position when GPS is active
  useEffect(() => {
    if (isGPSActive && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          updateLocationWithMovementCheck(
            pos.coords.latitude,
            pos.coords.longitude,
            'My GPS Location'
          );
        },
        (_err) => {
          // Watch error silently handled, position will retain last valid
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isGPSActive, updateLocationWithMovementCheck]);

  const setCustomLocation = useCallback((loc: LocationState) => {
    setIsGPSActive(false);
    setError(null);
    prevLocationRef.current = loc;
    setLocation(loc);
    setHasMoved(true);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    location,
    permissionState,
    isGPSActive,
    error,
    hasMoved,
    requestGPS,
    setCustomLocation,
    clearError,
  };
}
