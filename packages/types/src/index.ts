export type CrowdLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface Pandal {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  entranceLatitude?: number;
  entranceLongitude?: number;
  imageUrl?: string;
  imageAlt?: string;
  address: string;
  area: string;
  city: string;
  category: string;
  estimatedVisitMinutes: number;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface FeasibleRoute {
  distanceMeters: number;
  durationSeconds: number;
  detourRatio: number;
  geometry: RouteGeometry;
}

export interface RouteResponse {
  success: boolean;
  profile: 'walking';
  distanceMeters: number;
  durationSeconds: number;
  detourRatio: number;
  geometry: RouteGeometry;
  route?: FeasibleRoute;
  error?: string;
}

export interface CrowdReport {
  id: string;
  pandalId: string;
  crowdLevel: CrowdLevel;
  crowdScore: number;
  queueMinutes: number;
  confidence: number;
  source: string;
  reportedAt: Date | string;
  expiresAt: Date | string;
  createdAt: Date | string;
}

export type RecommendationMode = 'QUICK_HOP' | 'LOW_CROWD' | 'BALANCED';

export interface PandalRecommendation {
  pandal: Pandal;
  pandalId?: string;
  name?: string;
  imageUrl?: string;
  imageAlt?: string;
  distanceMeters: number;
  estimatedTravelMinutes: number;
  etaMinutes?: number;
  crowdLevel: CrowdLevel;
  crowdConfidence: number;
  queueMinutes: number;
  estimatedVisitDurationMinutes: number;
  score: number;
  explanation: string;
  reason?: string;
}

export interface RecommendationResponse {
  recommended: PandalRecommendation | null;
  alternatives: PandalRecommendation[];
  totalEvaluated: number;
  userLocation: {
    lat: number;
    lng: number;
  };
  mode: RecommendationMode;
}

export interface User {
  id: string;
  createdAt: Date | string;
}

export interface Trip {
  id: string;
  userId: string;
  startedAt: Date | string;
  endedAt?: Date | string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export type TripEventType = 'VISITED' | 'SKIPPED' | 'RECOMMENDED';

export interface TripEvent {
  id: string;
  tripId: string;
  pandalId: string;
  eventType: TripEventType;
  timestamp: Date | string;
}
