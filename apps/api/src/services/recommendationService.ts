import { IPandalRepository } from '../repositories/pandalRepository.js';
import { scorePandals, ScoringInputCandidate } from '@pujofy/scoring';
import { RecommendationMode, RecommendationResponse } from '@pujofy/types';

export class RecommendationService {
  constructor(private pandalRepo: IPandalRepository) {}

  async getNextRecommendations(
    lat: number,
    lng: number,
    mode: RecommendationMode = 'BALANCED',
    radiusMeters: number = 5000
  ): Promise<RecommendationResponse> {
    const nearbyResults = await this.pandalRepo.findNearby(lat, lng, radiusMeters);

    const candidates: ScoringInputCandidate[] = nearbyResults.map((r) => ({
      pandal: r.pandal,
      distanceMeters: r.distanceMeters,
      latestCrowdReport: r.latestCrowdReport,
    }));

    const scored = scorePandals(candidates, mode);

    // Limit to max 3 total (1 recommended + up to 2 alternatives)
    const topCandidates = scored.slice(0, 3);

    const recommended = topCandidates.length > 0 ? topCandidates[0] : null;
    const alternatives = topCandidates.length > 1 ? topCandidates.slice(1) : [];

    return {
      recommended,
      alternatives,
      totalEvaluated: candidates.length,
      userLocation: { lat, lng },
      mode,
    };
  }
}
