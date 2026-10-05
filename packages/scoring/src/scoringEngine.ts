import {
  CrowdLevel,
  CrowdReport,
  Pandal,
  PandalRecommendation,
  RecommendationMode,
} from '@pujofy/types';

export interface ScoringInputCandidate {
  pandal: Pandal;
  distanceMeters: number;
  latestCrowdReport?: CrowdReport | null;
}

export interface WeightConfig {
  wTravel: number;
  wCrowd: number;
  wQueue: number;
  wDistance: number;
}

export const MODE_WEIGHTS: Record<RecommendationMode, WeightConfig> = {
  QUICK_HOP: {
    wTravel: 0.35,
    wDistance: 0.35,
    wCrowd: 0.15,
    wQueue: 0.15,
  },
  LOW_CROWD: {
    wTravel: 0.10,
    wDistance: 0.10,
    wCrowd: 0.40,
    wQueue: 0.40,
  },
  BALANCED: {
    wTravel: 0.25,
    wDistance: 0.25,
    wCrowd: 0.25,
    wQueue: 0.25,
  },
};

export function crowdLevelToScore(level: CrowdLevel): number {
  switch (level) {
    case 'LOW':
      return 0.25;
    case 'MEDIUM':
      return 0.50;
    case 'HIGH':
      return 0.75;
    case 'VERY_HIGH':
      return 1.00;
    default:
      return 0.50;
  }
}

export function calculateEstimatedTravelMinutes(distanceMeters: number): number {
  // Average walking speed during Puja pandal hopping ~ 4.5 km/h = 75 meters/min
  const minutes = distanceMeters / 75;
  return Math.max(1, Math.round(minutes));
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function generateExplanation(
  mode: RecommendationMode,
  pandal: Pandal,
  distanceMeters: number,
  crowdLevel: CrowdLevel,
  queueMinutes: number,
  isTop: boolean
): string {
  const distKm = (distanceMeters / 1000).toFixed(1);

  if (mode === 'QUICK_HOP') {
    return isTop
      ? `Top quick-hop pick: closest distance (${distKm} km) with fast travel time.`
      : `Nearby option (${distKm} km) suitable for quick hopping.`;
  }

  if (mode === 'LOW_CROWD') {
    return isTop
      ? `Best low-crowd option: ${crowdLevel.toLowerCase()} crowd with ~${queueMinutes} min wait.`
      : `Moderate crowd alternative with reasonable queue times.`;
  }

  // BALANCED
  return isTop
    ? `Optimal choice balancing distance (${distKm} km) and ${crowdLevel.toLowerCase()} crowd level.`
    : `Balanced alternative pandal nearby (${distKm} km, ~${queueMinutes} min queue).`;
}

export function scorePandals(
  candidates: ScoringInputCandidate[],
  mode: RecommendationMode = 'BALANCED'
): PandalRecommendation[] {
  if (candidates.length === 0) {
    return [];
  }

  const weights = MODE_WEIGHTS[mode] || MODE_WEIGHTS.BALANCED;

  const prepared = candidates.map((item) => {
    const travelTime = calculateEstimatedTravelMinutes(item.distanceMeters);
    const crowdLevel: CrowdLevel = item.latestCrowdReport?.crowdLevel || 'MEDIUM';
    const crowdScore =
      item.latestCrowdReport?.crowdScore ?? crowdLevelToScore(crowdLevel);
    const queueMinutes = item.latestCrowdReport?.queueMinutes ?? 15;
    const confidence = item.latestCrowdReport?.confidence ?? 0.8;

    return {
      candidate: item,
      travelTime,
      crowdLevel,
      crowdScore,
      queueMinutes,
      confidence,
      distanceMeters: item.distanceMeters,
    };
  });

  const minTravel = Math.min(...prepared.map((p) => p.travelTime));
  const maxTravel = Math.max(...prepared.map((p) => p.travelTime));

  const minCrowd = Math.min(...prepared.map((p) => p.crowdScore));
  const maxCrowd = Math.max(...prepared.map((p) => p.crowdScore));

  const minQueue = Math.min(...prepared.map((p) => p.queueMinutes));
  const maxQueue = Math.max(...prepared.map((p) => p.queueMinutes));

  const minDist = Math.min(...prepared.map((p) => p.distanceMeters));
  const maxDist = Math.max(...prepared.map((p) => p.distanceMeters));

  const scored = prepared.map((p) => {
    const normTravel = normalize(p.travelTime, minTravel, maxTravel);
    const normCrowd = normalize(p.crowdScore, minCrowd, maxCrowd);
    const normQueue = normalize(p.queueMinutes, minQueue, maxQueue);
    const normDist = normalize(p.distanceMeters, minDist, maxDist);

    const rawScore =
      weights.wTravel * normTravel +
      weights.wCrowd * normCrowd +
      weights.wQueue * normQueue +
      weights.wDistance * normDist;

    const score = Number(rawScore.toFixed(4));

    return {
      pandal: p.candidate.pandal,
      pandalId: p.candidate.pandal.id,
      name: p.candidate.pandal.name,
      imageUrl: p.candidate.pandal.imageUrl,
      imageAlt: p.candidate.pandal.imageAlt,
      distanceMeters: Math.round(p.distanceMeters),
      estimatedTravelMinutes: p.travelTime,
      etaMinutes: p.travelTime,
      crowdLevel: p.crowdLevel,
      crowdConfidence: p.confidence,
      queueMinutes: p.queueMinutes,
      estimatedVisitDurationMinutes: p.candidate.pandal.estimatedVisitMinutes || 30,
      score,
      explanation: '',
    };
  });

  scored.sort((a, b) => a.score - b.score);

  return scored.map((rec, index) => {
    const expl = generateExplanation(
      mode,
      rec.pandal,
      rec.distanceMeters,
      rec.crowdLevel,
      rec.queueMinutes,
      index === 0
    );
    return {
      ...rec,
      explanation: expl,
      reason: expl,
    };
  });
}
