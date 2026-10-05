import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { InMemoryPandalRepository } from '../src/repositories/pandalRepository.js';
import { InMemoryCrowdReportRepository } from '../src/repositories/crowdReportRepository.js';

describe('POST /api/crowd/report', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const pandalRepo = new InMemoryPandalRepository();
    const crowdRepo = new InMemoryCrowdReportRepository();
    app = await buildApp({ pandalRepo, crowdRepo, skipDbPlugin: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should accept valid crowd report', async () => {
    const payload = {
      pandalId: '11111111-1111-1111-1111-111111111101',
      crowdLevel: 'LOW',
      queueMinutes: 10,
      confidence: 0.9,
      source: 'USER',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/crowd/report',
      payload,
    });

    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.payload);
    expect(json.data.pandalId).toBe(payload.pandalId);
    expect(json.data.crowdLevel).toBe('LOW');
  });

  it('should reject invalid crowd level enum', async () => {
    const payload = {
      pandalId: '11111111-1111-1111-1111-111111111101',
      crowdLevel: 'EXTREME',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/crowd/report',
      payload,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 404 for unknown pandal UUID', async () => {
    const payload = {
      pandalId: '88888888-8888-8888-8888-888888888888',
      crowdLevel: 'MEDIUM',
      queueMinutes: 15,
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/crowd/report',
      payload,
    });

    expect(res.statusCode).toBe(404);
  });

  it('should ignore expired crowd reports in getLatestForPandal', async () => {
    const crowdRepo = new InMemoryCrowdReportRepository();
    const pandalId = '11111111-1111-1111-1111-111111111101';

    const report = await crowdRepo.create({
      pandalId,
      crowdLevel: 'VERY_HIGH',
      queueMinutes: 60,
    });

    // Manually set expiresAt in the past
    report.expiresAt = new Date(Date.now() - 1000).toISOString();
    // @ts-ignore
    crowdRepo.reports = [report];

    const latest = await crowdRepo.getLatestForPandal(pandalId);
    expect(latest).toBeNull();
  });
});

