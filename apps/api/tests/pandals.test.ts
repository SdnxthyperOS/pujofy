import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { InMemoryPandalRepository } from '../src/repositories/pandalRepository.js';
import { InMemoryCrowdReportRepository } from '../src/repositories/crowdReportRepository.js';

describe('Pandals API Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const pandalRepo = new InMemoryPandalRepository();
    const crowdRepo = new InMemoryCrowdReportRepository();
    app = await buildApp({ pandalRepo, crowdRepo, skipDbPlugin: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/pandals/nearby should return nearby pandals within radius', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pandals/nearby?lat=22.57&lng=88.36&radius=5000',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.count).toBeGreaterThan(0);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].pandal).toBeDefined();
    expect(json.data[0].imageUrl).toMatch(/^\/images\/pandals\//);
    expect(json.data[0].imageAlt).toBeDefined();
    expect(json.data[0].distanceMeters).toBeDefined();
  });

  it('GET /api/pandals/nearby should return 400 for invalid query params', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pandals/nearby?lat=invalid&lng=88.36',
    });

    expect(res.statusCode).toBe(400);
  });

  it('GET /api/pandals/:id should return details for valid pandal ID including imageUrl', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pandals/11111111-1111-1111-1111-111111111101',
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.data.id).toBe('11111111-1111-1111-1111-111111111101');
    expect(json.data.name).toBe('Sree Bhumi Sporting Club');
    expect(json.data.imageUrl).toBe('/images/pandals/pandal-001.webp');
    expect(json.data.imageAlt).toContain('Sree Bhumi Sporting Club');
  });

  it('GET /api/pandals/:id should return 404 for non-existent pandal UUID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/pandals/99999999-9999-9999-9999-999999999999',
    });

    expect(res.statusCode).toBe(404);
  });
});
