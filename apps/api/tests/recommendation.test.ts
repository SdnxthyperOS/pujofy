import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { InMemoryPandalRepository } from '../src/repositories/pandalRepository.js';
import { InMemoryCrowdReportRepository } from '../src/repositories/crowdReportRepository.js';

describe('GET /api/recommendations/next', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const pandalRepo = new InMemoryPandalRepository();
    const crowdRepo = new InMemoryCrowdReportRepository();
    app = await buildApp({ pandalRepo, crowdRepo, skipDbPlugin: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return recommended pandal and alternatives (max 3 total)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/recommendations/next?lat=22.57&lng=88.36&mode=BALANCED&radius=10000',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.recommended).toBeDefined();
    expect(json.recommended.pandal.name).toBeDefined();
    expect(json.recommended.pandal.imageUrl).toMatch(/^\/images\/pandals\//);
    expect(json.recommended.imageUrl).toMatch(/^\/images\/pandals\//);
    expect(json.recommended.imageAlt).toBeDefined();
    expect(json.recommended.distanceMeters).toBeGreaterThan(0);
    expect(json.recommended.estimatedTravelMinutes).toBeGreaterThan(0);
    expect(json.recommended.crowdLevel).toBeDefined();
    expect(json.recommended.score).toBeDefined();
    expect(json.recommended.explanation).toBeDefined();

    expect(json.alternatives).toBeDefined();
    const totalReturned = (json.recommended ? 1 : 0) + json.alternatives.length;
    expect(totalReturned).toBeLessThanOrEqual(3);
  });

  it('should adjust recommendations based on mode', async () => {
    const resQuick = await app.inject({
      method: 'GET',
      url: '/api/recommendations/next?lat=22.57&lng=88.36&mode=QUICK_HOP&radius=10000',
    });

    const resCrowd = await app.inject({
      method: 'GET',
      url: '/api/recommendations/next?lat=22.57&lng=88.36&mode=LOW_CROWD&radius=10000',
    });

    expect(resQuick.statusCode).toBe(200);
    expect(resCrowd.statusCode).toBe(200);

    const jsonQuick = JSON.parse(resQuick.payload);
    const jsonCrowd = JSON.parse(resCrowd.payload);

    expect(jsonQuick.mode).toBe('QUICK_HOP');
    expect(jsonCrowd.mode).toBe('LOW_CROWD');
  });

  it('should reflect newly submitted crowd reports in recommendation score', async () => {
    // Pandal 11111111-1111-1111-1111-111111111101 initially has VERY_HIGH crowd
    const pandalId = '11111111-1111-1111-1111-111111111101';

    // Submit a LOW crowd report for this pandal
    const reportRes = await app.inject({
      method: 'POST',
      url: '/api/crowd/report',
      payload: {
        pandalId,
        crowdLevel: 'LOW',
        queueMinutes: 5,
        confidence: 0.95,
      },
    });
    expect(reportRes.statusCode).toBe(201);

    // Query LOW_CROWD mode recommendations right at Sree Bhumi's location
    const recRes = await app.inject({
      method: 'GET',
      url: '/api/recommendations/next?lat=22.5982&lng=88.3985&mode=LOW_CROWD&radius=10000',
    });

    expect(recRes.statusCode).toBe(200);
    const json = JSON.parse(recRes.payload);

    // Verify the updated crowd level was used in scoring
    const targetRec = [json.recommended, ...json.alternatives].find(
      (r: any) => r?.pandal?.id === pandalId
    );
    expect(targetRec).toBeDefined();
    expect(targetRec.crowdLevel).toBe('LOW');
    expect(targetRec.queueMinutes).toBe(5);
  });

  it('should return null recommended and empty alternatives when no pandals are in radius', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/recommendations/next?lat=0&lng=0&radius=100',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.recommended).toBeNull();
    expect(json.alternatives).toEqual([]);
    expect(json.totalEvaluated).toBe(0);
  });
});

