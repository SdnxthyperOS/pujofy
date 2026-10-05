import { CrowdReport } from '@pujofy/types';

export function mapDbToCrowdReport(row: any): CrowdReport {
  return {
    id: row.id,
    pandalId: row.pandal_id,
    crowdLevel: row.crowd_level,
    crowdScore: parseFloat(row.crowd_score),
    queueMinutes: parseInt(row.queue_minutes, 10),
    confidence: parseFloat(row.confidence),
    source: row.source || 'USER',
    reportedAt: row.reported_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
