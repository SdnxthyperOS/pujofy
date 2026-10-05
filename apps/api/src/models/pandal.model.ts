import { Pandal } from '@pujofy/types';

export function mapDbToPandal(row: any): Pandal {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    entranceLatitude:
      row.entrance_latitude !== undefined && row.entrance_latitude !== null
        ? parseFloat(row.entrance_latitude)
        : row.entranceLatitude !== undefined && row.entranceLatitude !== null
        ? parseFloat(row.entranceLatitude)
        : undefined,
    entranceLongitude:
      row.entrance_longitude !== undefined && row.entrance_longitude !== null
        ? parseFloat(row.entrance_longitude)
        : row.entranceLongitude !== undefined && row.entranceLongitude !== null
        ? parseFloat(row.entranceLongitude)
        : undefined,
    imageUrl: row.image_url || row.imageUrl || `/images/pandals/fallback.webp`,
    imageAlt: row.image_alt || row.imageAlt || `Festive Durga Puja pandal at ${row.name}`,
    address: row.address || '',
    area: row.area || '',
    city: row.city || 'Kolkata',
    category: row.category || 'General',
    estimatedVisitMinutes: row.estimated_visit_minutes || 30,
    openingTime: row.opening_time || '00:00',
    closingTime: row.closing_time || '23:59',
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
