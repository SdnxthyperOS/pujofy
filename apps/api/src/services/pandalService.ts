import { IPandalRepository } from '../repositories/pandalRepository.js';
import { Pandal } from '@pujofy/types';

export class PandalService {
  constructor(private pandalRepo: IPandalRepository) {}

  async getPandalById(id: string): Promise<Pandal | null> {
    return this.pandalRepo.findById(id);
  }

  async getNearbyPandals(lat: number, lng: number, radiusMeters: number = 5000) {
    const results = await this.pandalRepo.findNearby(lat, lng, radiusMeters);
    return results.map((r) => ({
      id: r.pandal.id,
      name: r.pandal.name,
      description: r.pandal.description,
      latitude: r.pandal.latitude,
      longitude: r.pandal.longitude,
      imageUrl: r.pandal.imageUrl,
      imageAlt: r.pandal.imageAlt,
      address: r.pandal.address,
      area: r.pandal.area,
      city: r.pandal.city,
      category: r.pandal.category,
      estimatedVisitMinutes: r.pandal.estimatedVisitMinutes,
      openingTime: r.pandal.openingTime,
      closingTime: r.pandal.closingTime,
      distanceMeters: r.distanceMeters,
      crowdLevel: r.latestCrowdReport?.crowdLevel || 'MEDIUM',
      queueMinutes: r.latestCrowdReport?.queueMinutes || 15,
      crowdReport: r.latestCrowdReport,
      pandal: r.pandal,
    }));
  }
}
