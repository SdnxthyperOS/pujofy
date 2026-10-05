import { calculateHaversineDistanceMeters } from '../utils/haversine.js';
import { env } from '../config/env.js';

export interface Coordinates {
  lat: number;
  lng: number;
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

export interface IRoutingService {
  getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResponse>;
  getDistance(origin: Coordinates, destination: Coordinates): Promise<number>;
  getETA(origin: Coordinates, destination: Coordinates): Promise<number>;
}

/**
 * Validates whether a candidate pedestrian route is physically feasible or absurd.
 *
 * Real pedestrian routes can have reasonable detours (rivers, rail lines, bridges, one-way alleys),
 * but routes with extreme detour ratios (> 5.0 for significant distances) or extreme walking distances
 * for adjacent points are physically absurd and must be rejected.
 */
export function validateRouteFeasibility(
  straightLineMeters: number,
  routeDistanceMeters: number,
  detourRatio: number
): { isFeasible: boolean; reason?: string } {
  // Absurd detour ratio threshold (detourRatio > 5.0 with excess > 400m)
  if (detourRatio > 5.0 && routeDistanceMeters - straightLineMeters > 400) {
    return {
      isFeasible: false,
      reason: `Detour ratio ${detourRatio.toFixed(2)} exceeds sanity threshold (Route: ${routeDistanceMeters}m vs Straight: ${straightLineMeters}m)`,
    };
  }

  // If straight line is trivial (< 50m), allow up to 500m walking route (e.g. going around an enclosure)
  if (straightLineMeters <= 50) {
    if (routeDistanceMeters > 500) {
      return {
        isFeasible: false,
        reason: `Route distance ${routeDistanceMeters}m is excessive for close point (${straightLineMeters}m)`,
      };
    }
    return { isFeasible: true };
  }

  // If straight line is less than 500m, pedestrian walking route shouldn't exceed 2.5km
  if (straightLineMeters <= 500 && routeDistanceMeters > 2500) {
    return {
      isFeasible: false,
      reason: `Impractical walking distance ${routeDistanceMeters}m for close destination (${straightLineMeters}m)`,
    };
  }

  return { isFeasible: true };
}

/**
 * Computes the route selection cost for ranking feasible candidate routes.
 * Prefers practical walking duration, minimal distance penalty, and low detour penalty.
 */
export function calculateRouteCost(
  durationSeconds: number,
  distanceMeters: number,
  detourRatio: number
): number {
  let cost = durationSeconds;
  // Distance factor: 0.05 per meter
  cost += distanceMeters * 0.05;
  // Excess detour penalty for ratios over 1.6
  if (detourRatio > 1.6) {
    cost += (detourRatio - 1.6) * 100;
  }
  return cost;
}

/**
 * Evaluates candidate routes from routing providers and picks the most practical feasible route.
 */
export function evaluateAndSelectBestRoute(
  origin: Coordinates,
  destination: Coordinates,
  candidateRoutes: Array<{
    distance: number;
    duration: number;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  }>
): RouteResponse {
  const straightLineDistance = calculateHaversineDistanceMeters(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  const evaluatedCandidates: Array<{
    route: FeasibleRoute;
    cost: number;
    isFeasible: boolean;
    reason?: string;
  }> = [];

  for (const candidate of candidateRoutes) {
    const routeDistance = Math.round(candidate.distance);
    const durationSeconds = Math.round(candidate.duration);
    const detourRatio =
      Math.round((routeDistance / Math.max(straightLineDistance, 10)) * 100) / 100;

    const validation = validateRouteFeasibility(
      straightLineDistance,
      routeDistance,
      detourRatio
    );

    const cost = calculateRouteCost(durationSeconds, routeDistance, detourRatio);

    evaluatedCandidates.push({
      route: {
        distanceMeters: routeDistance,
        durationSeconds,
        detourRatio,
        geometry: candidate.geometry,
      },
      cost,
      isFeasible: validation.isFeasible,
      reason: validation.reason,
    });
  }

  const feasibleCandidates = evaluatedCandidates.filter((c) => c.isFeasible);

  if (feasibleCandidates.length === 0) {
    const rejectionReasons = evaluatedCandidates.map((c) => c.reason).join('; ');
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `[Pujofy Routing] All ${evaluatedCandidates.length} candidate routes rejected for origin (${origin.lat}, ${origin.lng}) -> dest (${destination.lat}, ${destination.lng}). Reasons: ${rejectionReasons}`
      );
    }
    throw new Error('No feasible walking route found');
  }

  // Sort by lowest cost
  feasibleCandidates.sort((a, b) => a.cost - b.cost);
  const best = feasibleCandidates[0].route;

  if (process.env.NODE_ENV !== 'test') {
    console.info(
      `[Pujofy Routing] Selected practical route: ${best.distanceMeters}m, ${best.durationSeconds}s, detourRatio=${best.detourRatio} from ${evaluatedCandidates.length} candidate(s)`
    );
  }

  return {
    success: true,
    profile: 'walking',
    distanceMeters: best.distanceMeters,
    durationSeconds: best.durationSeconds,
    detourRatio: best.detourRatio,
    geometry: best.geometry,
    route: best,
  };
}

/**
 * Real pedestrian fallback using OSRM walking engine.
 * Does NOT generate fake straight lines.
 */
export class OSRMWalkingFallbackRoutingService implements IRoutingService {
  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResponse> {
    try {
      const url = `http://router.project-osrm.org/route/v1/walking/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&alternatives=true`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          return evaluateAndSelectBestRoute(origin, destination, data.routes);
        }
      }
    } catch (err: any) {
      if (err?.message === 'No feasible walking route found') {
        throw err;
      }
    }

    throw new Error('No feasible walking route found');
  }

  async getDistance(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.distanceMeters;
  }

  async getETA(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.durationSeconds;
  }
}

/**
 * Mapbox Directions Routing Service with pedestrian walking profile,
 * alternatives evaluation, feasibility validation, and practical route selection.
 */
export class MapboxRoutingService implements IRoutingService {
  private accessToken: string;
  private fallbackService: IRoutingService;

  constructor(accessToken?: string, fallbackService?: IRoutingService) {
    this.accessToken = accessToken ?? env.MAPBOX_ACCESS_TOKEN ?? '';
    this.fallbackService = fallbackService ?? new OSRMWalkingFallbackRoutingService();
  }

  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResponse> {
    const hasValidToken =
      Boolean(this.accessToken) &&
      this.accessToken.trim() !== '' &&
      this.accessToken !== 'your_mapbox_access_token_here';

    if (!hasValidToken) {
      return this.fallbackService.getRoute(origin, destination);
    }

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=true&geometries=geojson&overview=full&access_token=${this.accessToken}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          return evaluateAndSelectBestRoute(origin, destination, data.routes);
        }
      }
    } catch (err: any) {
      if (err?.message === 'No feasible walking route found') {
        throw err;
      }
      // Network error or timeout: try fallback service
    }

    return this.fallbackService.getRoute(origin, destination);
  }

  async getDistance(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.distanceMeters;
  }

  async getETA(origin: Coordinates, destination: Coordinates): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.durationSeconds;
  }
}
