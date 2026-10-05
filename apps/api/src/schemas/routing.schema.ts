import { z } from 'zod';

const latSchema = (name: string) =>
  z.coerce
    .number({ invalid_type_error: `${name} must be a valid number` })
    .refine((v) => !isNaN(v) && v >= -90 && v <= 90, {
      message: `${name} must be a valid latitude between -90 and 90`,
    });

const lngSchema = (name: string) =>
  z.coerce
    .number({ invalid_type_error: `${name} must be a valid number` })
    .refine((v) => !isNaN(v) && v >= -180 && v <= 180, {
      message: `${name} must be a valid longitude between -180 and 180`,
    });

export const routeQuerySchema = z.object({
  originLat: latSchema('originLat'),
  originLng: lngSchema('originLng'),
  destinationLat: latSchema('destinationLat'),
  destinationLng: lngSchema('destinationLng'),
});

export type RouteQuery = z.infer<typeof routeQuerySchema>;

