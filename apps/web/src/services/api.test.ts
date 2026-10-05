import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MOCK_PANDALS,
  fetchNearbyPandals,
  fetchRecommendations,
  fetchPandalById,
  submitCrowdReport,
  checkBackendHealth,
  fetchRoute,
} from './api';

describe('Web API Service Layer', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('has mock pandals defined with required properties including imageUrl and imageAlt', () => {
    expect(MOCK_PANDALS.length).toBeGreaterThan(5);
    const suruchi = MOCK_PANDALS.find((p) => p.name === 'Suruchi Sangha');
    expect(suruchi).toBeDefined();
    expect(suruchi?.area).toBe('South Kolkata');
    expect(suruchi?.imageUrl).toMatch(/^\/images\/pandals\//);
    expect(suruchi?.imageAlt).toBeDefined();
    expect(suruchi?.latitude).toBeDefined();
    expect(suruchi?.longitude).toBeDefined();
  });

  it('falls back gracefully to mock pandals when API is offline', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const res = await fetchNearbyPandals(22.5278, 88.3294);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.isMock).toBe(true);
  });

  it('generates scored recommendations in mock fallback mode', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const res = await fetchRecommendations(22.5278, 88.3294, 'BALANCED');
    expect(res.isMock).toBe(true);
    expect(res.response.recommended).not.toBeNull();
    expect(res.response.recommended?.explanation).toBeDefined();
    expect(res.response.alternatives.length).toBeGreaterThan(0);
  });

  it('fetches pandal by id with offline fallback', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const targetId = MOCK_PANDALS[0].id;
    const res = await fetchPandalById(targetId);
    expect(res.isMock).toBe(true);
    expect(res.data?.name).toBe(MOCK_PANDALS[0].name);
  });

  it('handles backend health check failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const health = await checkBackendHealth();
    expect(health).toBe(false);
  });

  it('handles live backend response when fetch succeeds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: MOCK_PANDALS.slice(0, 2),
      }),
    } as Response);

    const res = await fetchNearbyPandals(22.5278, 88.3294);
    expect(res.isMock).toBe(false);
    expect(res.data.length).toBe(2);
  });

  it('fetches route when backend returns valid route', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        profile: 'walking',
        distanceMeters: 750,
        durationSeconds: 540,
        detourRatio: 1.35,
        geometry: {
          type: 'LineString',
          coordinates: [
            [88.36, 22.57],
            [88.37, 22.58],
          ],
        },
      }),
    } as Response);

    const res = await fetchRoute(22.57, 88.36, 22.58, 88.37);
    expect(res.isMock).toBe(false);
    expect(res.data.distanceMeters).toBe(750);
    expect(res.data.durationSeconds).toBe(540);
    expect(res.data.geometry.type).toBe('LineString');
    expect(res.data.geometry.coordinates).toHaveLength(2);
  });

  it('rejects when routing API fails without generating a fake line', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'));
    await expect(fetchRoute(22.57, 88.36, 22.58, 88.37)).rejects.toThrow(
      'Unable to find a feasible walking route to this pandal.'
    );
  });
});

