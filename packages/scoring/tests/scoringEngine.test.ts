import { describe, it, expect } from 'vitest';
import { scorePandals, ScoringInputCandidate } from '../src/scoringEngine.js';
import { Pandal, CrowdReport } from '@pujofy/types';

const mockPandal1: Pandal = {
  id: 'pandal-1',
  name: 'Sree Bhumi Sporting Club',
  description: 'Grand replica pandal',
  latitude: 22.598,
  longitude: 88.398,
  address: 'VIP Road, Lake Town',
  area: 'Lake Town',
  city: 'Kolkata',
  category: 'Traditional & Grand',
  estimatedVisitMinutes: 45,
  openingTime: '00:00',
  closingTime: '23:59',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPandal2: Pandal = {
  id: 'pandal-2',
  name: 'College Square',
  description: 'Water body illuminated pandal',
  latitude: 22.574,
  longitude: 88.363,
  address: 'College Street',
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

const mockPandal3: Pandal = {
  id: 'pandal-3',
  name: 'Chetla Agrani',
  description: 'Artistic theme pandal',
  latitude: 22.518,
  longitude: 88.344,
  address: 'Chetla',
  area: 'Chetla',
  city: 'Kolkata',
  category: 'Theme',
  estimatedVisitMinutes: 35,
  openingTime: '00:00',
  closingTime: '23:59',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const crowdReportHigh: CrowdReport = {
  id: 'cr-1',
  pandalId: 'pandal-1',
  crowdLevel: 'VERY_HIGH',
  crowdScore: 0.95,
  queueMinutes: 60,
  confidence: 0.9,
  source: 'USER',
  reportedAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const crowdReportLow: CrowdReport = {
  id: 'cr-2',
  pandalId: 'pandal-2',
  crowdLevel: 'LOW',
  crowdScore: 0.20,
  queueMinutes: 10,
  confidence: 0.85,
  source: 'USER',
  reportedAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe('Scoring Engine', () => {
  it('should return empty list when no candidates passed', () => {
    const result = scorePandals([], 'BALANCED');
    expect(result).toEqual([]);
  });

  it('should handle single candidate cleanly', () => {
    const candidate: ScoringInputCandidate = {
      pandal: mockPandal1,
      distanceMeters: 500,
      latestCrowdReport: crowdReportHigh,
    };
    const results = scorePandals([candidate], 'BALANCED');
    expect(results).toHaveLength(1);
    expect(results[0].pandal.id).toBe('pandal-1');
    expect(results[0].explanation).toBeDefined();
  });

  it('should prioritize closest pandal in QUICK_HOP mode', () => {
    const candidates: ScoringInputCandidate[] = [
      { pandal: mockPandal1, distanceMeters: 4000, latestCrowdReport: crowdReportLow },
      { pandal: mockPandal2, distanceMeters: 300, latestCrowdReport: crowdReportHigh },
    ];

    const results = scorePandals(candidates, 'QUICK_HOP');
    expect(results[0].pandal.id).toBe('pandal-2');
  });

  it('should prioritize low crowd pandal in LOW_CROWD mode', () => {
    const candidates: ScoringInputCandidate[] = [
      { pandal: mockPandal1, distanceMeters: 300, latestCrowdReport: crowdReportHigh },
      { pandal: mockPandal2, distanceMeters: 1200, latestCrowdReport: crowdReportLow },
    ];

    const results = scorePandals(candidates, 'LOW_CROWD');
    expect(results[0].pandal.id).toBe('pandal-2');
  });

  it('should rank 3 candidates in BALANCED mode and provide reasons', () => {
    const candidates: ScoringInputCandidate[] = [
      { pandal: mockPandal1, distanceMeters: 3000, latestCrowdReport: crowdReportHigh },
      { pandal: mockPandal2, distanceMeters: 800, latestCrowdReport: crowdReportLow },
      { pandal: mockPandal3, distanceMeters: 1500, latestCrowdReport: null },
    ];

    const results = scorePandals(candidates, 'BALANCED');
    expect(results).toHaveLength(3);
    expect(results[0].score).toBeLessThanOrEqual(results[1].score);
    expect(results[1].score).toBeLessThanOrEqual(results[2].score);
    expect(results[0].explanation).toContain('Optimal choice');
  });
});
