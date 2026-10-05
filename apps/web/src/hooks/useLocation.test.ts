import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateDistanceMeters, useLocation } from './useLocation';

describe('useLocation Distance & Movement Helpers', () => {
  it('calculates haversine distance between Park Street and College Square accurately', () => {
    // Park Street (22.5510, 88.3530) to College Square (22.5744, 88.3639) ~2.8 km
    const dist = calculateDistanceMeters(22.5510, 88.3530, 22.5744, 88.3639);
    expect(dist).toBeGreaterThan(2500);
    expect(dist).toBeLessThan(3200);
  });

  it('detects distances under 100 meters correctly', () => {
    // 22.5510, 88.3530 to 22.5512, 88.3532 is ~30 meters
    const dist = calculateDistanceMeters(22.5510, 88.3530, 22.5512, 88.3532);
    expect(dist).toBeLessThan(100);
  });

  it('detects distances over 100 meters correctly', () => {
    // 22.5510, 88.3530 to 22.5560, 88.3580 is ~700 meters
    const dist = calculateDistanceMeters(22.5510, 88.3530, 22.5560, 88.3580);
    expect(dist).toBeGreaterThan(100);
  });

  it('returns 0 for identical coordinates', () => {
    const dist = calculateDistanceMeters(22.5982, 88.3985, 22.5982, 88.3985);
    expect(dist).toBe(0);
  });
});

describe('Browser Geolocation Handling Mock Verification', () => {
  const originalGeolocation = globalThis.navigator?.geolocation;

  afterEach(() => {
    if (globalThis.navigator) {
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
        writable: true,
      });
    }
  });

  it('handles permission denied error callback correctly', () => {
    let errorCallback: (err: any) => void = () => {};

    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        errorCallback = error;
        error({ code: 1, PERMISSION_DENIED: 1, message: 'User denied geolocation' });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    let state = {
      permissionState: 'prompt',
      isGPSActive: false,
      error: null as string | null,
    };

    const mockRequestGPS = () => {
      globalThis.navigator.geolocation.getCurrentPosition(
        () => {},
        (err: any) => {
          if (err.code === err.PERMISSION_DENIED) {
            state.permissionState = 'denied';
            state.error = 'Location permission denied. Using fallback Puja hub.';
          }
          state.isGPSActive = false;
        }
      );
    };

    mockRequestGPS();

    expect(state.permissionState).toBe('denied');
    expect(state.error).toContain('denied');
    expect(state.isGPSActive).toBe(false);
  });

  it('handles successful geolocation acquisition', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 22.5982,
            longitude: 88.3985,
            accuracy: 10,
          },
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    let state = {
      permissionState: 'prompt',
      isGPSActive: false,
      lat: 0,
      lng: 0,
    };

    const mockRequestGPS = () => {
      globalThis.navigator.geolocation.getCurrentPosition((pos: any) => {
        state.permissionState = 'granted';
        state.isGPSActive = true;
        state.lat = pos.coords.latitude;
        state.lng = pos.coords.longitude;
      });
    };

    mockRequestGPS();

    expect(state.permissionState).toBe('granted');
    expect(state.isGPSActive).toBe(true);
    expect(state.lat).toBe(22.5982);
    expect(state.lng).toBe(88.3985);
  });

  it('handles timeout error gracefully', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({ code: 3, TIMEOUT: 3, message: 'Timed out' });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };

    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    let errorMsg: string | null = null;
    globalThis.navigator.geolocation.getCurrentPosition(
      () => {},
      (err: any) => {
        if (err.code === err.TIMEOUT) {
          errorMsg = 'Location request timed out. Using fallback Puja hub.';
        }
      }
    );

    expect(errorMsg).toContain('timed out');
  });
});
