import { z } from 'zod';

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(5000),
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;

export const pandalParamsSchema = z.object({
  id: z.string().uuid(),
});

export type PandalParams = z.infer<typeof pandalParamsSchema>;

export const recommendationQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  mode: z.enum(['QUICK_HOP', 'LOW_CROWD', 'BALANCED']).default('BALANCED'),
  radius: z.coerce.number().positive().default(5000),
});

export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;

export const crowdReportBodySchema = z.object({
  pandalId: z.string().uuid(),
  crowdLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  queueMinutes: z.number().int().nonnegative().default(15),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().optional().default('USER'),
});

export type CrowdReportBody = z.infer<typeof crowdReportBodySchema>;
