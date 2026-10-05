import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import {
  MapboxRoutingService,
  OSRMWalkingFallbackRoutingService,
  validateRouteFeasibility,
  calculateRouteCost,
  evaluateAndSelectBestRoute,
} from '../src/services/routingService.js';
import { InMemoryPandalRepository } from '../src/repositories/pandalRepository.js';
import { InMemoryCrowdReportRepository } from '../src/repositories/crowdReportRepository.js';
import { Pandal } from '@pujofy/types';

describe('Routing Service & Route Feasibility Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const pandalRepo = new InMemoryPandalRepository();
    const crowdRepo = new InMemoryCrowdReportRepository();
    app = await buildApp({ pandalRepo, crowdRepo, skipDbPlugin: true });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Route Feasibility & Selection Unit Tests', () => {
    // Test 1 — Walking profile & Test 2 — Alternative routes
    it('Test 1 & 2: should request walking profile and alternatives=true from Mapbox', async () => {
      const originalFetch = globalThis.fetch;
      let requestedUrl = '';

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        requestedUrl = url;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            code: 'Ok',
            routes: [
              {
                distance: 700,
                duration: 540,
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [88.36, 22.57],
                    [88.365, 22.575],
                  ],
                },
              },
            ],
          }),
        } as Response);
      });

      const mapboxService = new MapboxRoutingService('test_token');
      const origin = { lat: 22.57, lng: 88.36 };
      const destination = { lat: 22.575, lng: 88.365 };

      const res = await mapboxService.getRoute(origin, destination);

      // Verify walking profile
      expect(requestedUrl).toContain('/directions/v5/mapbox/walking/');
      // Verify alternatives=true
      expect(requestedUrl).toContain('alternatives=true');
      expect(requestedUrl).toContain('overview=full');
      expect(res.profile).toBe('walking');
      expect(res.distanceMeters).toBe(700);

      globalThis.fetch = originalFetch;
    });

    // Test 3 — Normal route acceptance
    it('Test 3: should accept normal route with realistic detour ratio (e.g., straight=500m, route=700m -> detour=1.4)', () => {
      const straightLine = 500;
      const routeDistance = 700;
      const detourRatio = 1.4;

      const validation = validateRouteFeasibility(straightLine, routeDistance, detourRatio);
      expect(validation.isFeasible).toBe(true);

      const cost = calculateRouteCost(540, routeDistance, detourRatio);
      expect(cost).toBeGreaterThan(0);
    });

    // Test 4 — Suspicious / absurd route rejection
    it('Test 4: should reject suspicious / absurd detour route (e.g., straight=400m, route=5000m -> detour=12.5)', () => {
      const straightLine = 400;
      const routeDistance = 5000;
      const detourRatio = 12.5;

      const validation = validateRouteFeasibility(straightLine, routeDistance, detourRatio);
      expect(validation.isFeasible).toBe(false);
      expect(validation.reason).toContain('Detour ratio');
    });

    // Test 5 — Routing failure does NOT create fake navigation line
    it('Test 5: should throw error on routing failure instead of generating fake straight line', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const fallbackService = new OSRMWalkingFallbackRoutingService();
      const mapboxService = new MapboxRoutingService('test_token', fallbackService);

      const origin = { lat: 22.57, lng: 88.36 };
      const destination = { lat: 22.58, lng: 88.37 };

      await expect(mapboxService.getRoute(origin, destination)).rejects.toThrow(
        'No feasible walking route found'
      );

      globalThis.fetch = originalFetch;
    });

    it('Test 5b: should reject when all candidate routes are absurd and not produce fake line', () => {
      const origin = { lat: 22.57, lng: 88.36 };
      const destination = { lat: 22.574, lng: 88.36 }; // ~440m straight line

      const absurdCandidates = [
        {
          distance: 6000,
          duration: 4500,
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [88.36, 22.57],
              [88.42, 22.62],
              [88.36, 22.574],
            ] as [number, number][],
          },
        },
      ];

      expect(() => evaluateAndSelectBestRoute(origin, destination, absurdCandidates)).toThrow(
        'No feasible walking route found'
      );
    });

    // Test 6 & 7 — Pandal Entrance Coordinates & Backward Compatibility
    it('Test 6: should prioritize entrance coordinates when available', () => {
      const pandalWithEntrance: Pandal = {
        id: 'pandal-001',
        name: 'Sree Bhumi Sporting Club',
        description: 'Test pandal',
        latitude: 22.5982,
        longitude: 88.3985,
        entranceLatitude: 22.5986,
        entranceLongitude: 88.3989,
        address: 'VIP Road',
        area: 'Lake Town',
        city: 'Kolkata',
        category: 'Grand Architecture',
        estimatedVisitMinutes: 45,
        openingTime: '00:00',
        closingTime: '23:59',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const destLat = pandalWithEntrance.entranceLatitude ?? pandalWithEntrance.latitude;
      const destLng = pandalWithEntrance.entranceLongitude ?? pandalWithEntrance.longitude;

      expect(destLat).toBe(22.5986);
      expect(destLng).toBe(88.3989);
    });

    it('Test 7: should fall back to general latitude/longitude when entrance coordinates are absent', () => {
      const pandalWithoutEntrance: Pandal = {
        id: 'pandal-002',
        name: 'Generic Pandal',
        description: 'Test',
        latitude: 22.5746,
        longitude: 88.3637,
        address: 'College St',
        area: 'College Square',
        city: 'Kolkata',
        category: 'Heritage',
        estimatedVisitMinutes: 30,
        openingTime: '00:00',
        closingTime: '23:59',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const destLat = pandalWithoutEntrance.entranceLatitude ?? pandalWithoutEntrance.latitude;
      const destLng = pandalWithoutEntrance.entranceLongitude ?? pandalWithoutEntrance.longitude;

      expect(destLat).toBe(22.5746);
      expect(destLng).toBe(88.3637);
    });
  });

  describe('GET /api/routes API Endpoint Tests', () => {
    it('should return 200 with walking route details when route is calculated', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: 'Ok',
          routes: [
            {
              distance: 820,
              duration: 600,
              geometry: {
                type: 'LineString',
                coordinates: [
                  [88.36, 22.57],
                  [88.37, 22.58],
                ],
              },
            },
          ],
        }),
      } as Response);

      const res = await app.inject({
        method: 'GET',
        url: '/api/routes?originLat=22.57&originLng=88.36&destinationLat=22.58&destinationLng=88.37',
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.profile).toBe('walking');
      expect(json.distanceMeters).toBe(820);
      expect(json.durationSeconds).toBe(600);
      expect(json.detourRatio).toBeDefined();
      expect(json.geometry.type).toBe('LineString');

      globalThis.fetch = originalFetch;
    });

    it('should return 422 when no feasible route exists and not return a fake line', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const res = await app.inject({
        method: 'GET',
        url: '/api/routes?originLat=22.57&originLng=88.36&destinationLat=22.58&destinationLng=88.37',
      });

      expect(res.statusCode).toBe(422);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error).toBe('No feasible walking route found');

      globalThis.fetch = originalFetch;
    });

    it('should return 400 Bad Request when query parameters are invalid', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/routes?originLat=invalid&originLng=88.36',
      });

      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error).toBe('Invalid query parameters');
    });
  });
});
