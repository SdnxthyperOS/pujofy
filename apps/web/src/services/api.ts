import { Pandal, PandalRecommendation, RecommendationResponse, RecommendationMode, CrowdLevel } from '@pujofy/types';
import seedPandals from '../../../../data/seed/pandals.json';

// Default API Base URL (Fastify backend runs on port 3000)
const API_BASE = 'http://localhost:3000';

// Predefined Kolkata Puja Hubs for Location Switcher
export const KOLKATA_HUBS = [
  { name: 'Park Street / South Kolkata', lat: 22.5510, lng: 88.3530 },
  { name: 'College Square / Central Kolkata', lat: 22.5744, lng: 88.3639 },
  { name: 'Ekdalia Evergreen / Gariahat', lat: 22.5186, lng: 88.3667 },
  { name: 'Chetla Agrani / Rashbehari', lat: 22.5165, lng: 88.3412 },
  { name: 'Suruchi Sangha / Alipore', lat: 22.5278, lng: 88.3294 },
  { name: 'Sree Bhumi / Lake Town', lat: 22.5977, lng: 88.3975 },
];

// Rich 32 Kolkata Puja Pandals loaded from central seed dataset
export const MOCK_PANDALS: Pandal[] = (seedPandals as any[]).map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  latitude: item.latitude,
  longitude: item.longitude,
  imageUrl: item.imageUrl || '/images/pandals/fallback.webp',
  imageAlt: item.imageAlt || `Festive Durga Puja pandal at ${item.name}`,
  address: item.address,
  area: item.area,
  city: item.city,
  category: item.category,
  estimatedVisitMinutes: item.estimatedVisitMinutes,
  openingTime: item.openingTime,
  closingTime: item.closingTime,
  isActive: item.isActive,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// Default fallback photo for any pandal without custom image or on error
export const DEFAULT_PANDAL_PHOTO = '/images/pandals/fallback.webp';

// API Service Functions
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok' || data.status === 'UP';
    }
    return false;
  } catch {
    return false;
  }
}

export async function fetchNearbyPandals(lat: number, lng: number, radius = 5000): Promise<{ data: Pandal[]; isMock: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/pandals/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (res.ok) {
      const json = await res.json();
      const pandals: Pandal[] = (json.data || []).map((item: any) => item.pandal || item);
      return { data: pandals, isMock: false };
    }
  } catch {
    // API server unreachable -> Fallback to mock
  }
  return { data: MOCK_PANDALS, isMock: true };
}

export async function fetchPandalById(id: string): Promise<{ data: Pandal | null; isMock: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/pandals/${id}`);
    if (res.ok) {
      const json = await res.json();
      return { data: json.data, isMock: false };
    }
  } catch {
    // Fallback
  }
  const found = MOCK_PANDALS.find((p) => p.id === id) || null;
  return { data: found, isMock: true };
}

export async function fetchRecommendations(
  lat: number,
  lng: number,
  mode: RecommendationMode = 'BALANCED',
  radius = 5000
): Promise<{ response: RecommendationResponse; isMock: boolean }> {
  try {
    const res = await fetch(
      `${API_BASE}/api/recommendations/next?lat=${lat}&lng=${lng}&mode=${mode}&radius=${radius}`
    );
    if (res.ok) {
      const json = await res.json();
      return { response: json, isMock: false };
    }
  } catch {
    // Fallback
  }

  // Generate realistic recommendation response from mock data
  const recs: PandalRecommendation[] = MOCK_PANDALS.map((pandal, idx) => {
    // Calculate simple haversine approximation
    const dLat = (pandal.latitude - lat) * 111000;
    const dLng = (pandal.longitude - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
    const distMeters = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
    const travelMin = Math.max(3, Math.round(distMeters / 120)); // ~7km/h walking or slow Puja traffic

    const crowdLevels: CrowdLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'VERY_HIGH', 'LOW', 'HIGH'];
    const crowdLevel = crowdLevels[idx % crowdLevels.length];
    const queueMinutes = crowdLevel === 'LOW' ? 10 : crowdLevel === 'MEDIUM' ? 25 : crowdLevel === 'HIGH' ? 45 : 70;

    let score = 100 - travelMin * 2 - queueMinutes;
    if (mode === 'LOW_CROWD') {
      if (crowdLevel === 'LOW') score += 40;
      if (crowdLevel === 'VERY_HIGH') score -= 50;
    } else if (mode === 'QUICK_HOP') {
      score -= travelMin * 3;
    }

    let explanation = 'Short walk with moderate crowd. Great time to visit now!';
    if (crowdLevel === 'LOW') {
      explanation = 'Low queue wait times right now. Ideal quick hop!';
    } else if (crowdLevel === 'VERY_HIGH') {
      explanation = 'High crowd density. Consider visiting earlier or later.';
    }

    return {
      pandal,
      distanceMeters: distMeters || 450,
      estimatedTravelMinutes: travelMin || 7,
      crowdLevel,
      crowdConfidence: 0.92 - idx * 0.05,
      queueMinutes,
      estimatedVisitDurationMinutes: pandal.estimatedVisitMinutes || 20,
      score,
      explanation,
    };
  });

  // Sort by score
  recs.sort((a, b) => b.score - a.score);

  return {
    response: {
      recommended: recs[0] || null,
      alternatives: recs.slice(1),
      totalEvaluated: recs.length,
      userLocation: { lat, lng },
      mode,
    },
    isMock: true,
  };
}

export async function submitCrowdReport(payload: {
  pandalId: string;
  crowdLevel: CrowdLevel;
  queueMinutes: number;
}): Promise<{ success: boolean; isMock: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/crowd/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        confidence: 0.9,
        source: 'USER',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, isMock: false, message: json.message || 'Report submitted!' };
    }
  } catch {
    // Mock success
  }
  return { success: true, isMock: true, message: 'Crowd report recorded locally (Backend offline fallback)' };
}

export interface RouteResponse {
  success?: boolean;
  profile?: 'walking';
  distanceMeters: number;
  durationSeconds: number;
  detourRatio?: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  error?: string;
}

export async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{ data: RouteResponse; isMock: boolean }> {
  try {
    const res = await fetch(
      `${API_BASE}/api/routes?originLat=${originLat}&originLng=${originLng}&destinationLat=${destLat}&destinationLng=${destLng}`
    );
    if (res.ok) {
      const json = await res.json();
      if (json && json.geometry && Array.isArray(json.geometry.coordinates)) {
        return { data: json, isMock: false };
      }
    } else {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Unable to find a feasible walking route to this pandal.');
    }
  } catch (err: any) {
    if (err?.message?.includes('feasible') || err?.message?.includes('route')) {
      throw err;
    }
    throw new Error('Unable to find a feasible walking route to this pandal.');
  }

  throw new Error('Unable to find a feasible walking route to this pandal.');
}

