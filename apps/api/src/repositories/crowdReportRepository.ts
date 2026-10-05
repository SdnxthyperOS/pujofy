import { CrowdReport, CrowdLevel } from '@pujofy/types';
import pg from 'pg';
import { mapDbToCrowdReport } from '../models/crowdReport.model.js';
import { crowdLevelToScore } from '@pujofy/scoring';

export interface CreateCrowdReportInput {
  pandalId: string;
  crowdLevel: CrowdLevel;
  queueMinutes?: number;
  confidence?: number;
  source?: string;
}

export interface ICrowdReportRepository {
  create(input: CreateCrowdReportInput): Promise<CrowdReport>;
  getLatestForPandal(pandalId: string): Promise<CrowdReport | null>;
}

export class PgCrowdReportRepository implements ICrowdReportRepository {
  constructor(private pool: pg.Pool) {}

  async create(input: CreateCrowdReportInput): Promise<CrowdReport> {
    const crowdScore = crowdLevelToScore(input.crowdLevel);
    const queueMinutes = input.queueMinutes ?? 15;
    const confidence = input.confidence ?? 0.8;
    const source = input.source || 'USER';

    const query = `
      INSERT INTO crowd_reports (pandal_id, crowd_level, crowd_score, queue_minutes, confidence, source)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const res = await this.pool.query(query, [
      input.pandalId,
      input.crowdLevel,
      crowdScore,
      queueMinutes,
      confidence,
      source,
    ]);

    return mapDbToCrowdReport(res.rows[0]);
  }

  async getLatestForPandal(pandalId: string): Promise<CrowdReport | null> {
    const query = `
      SELECT * FROM crowd_reports
      WHERE pandal_id = $1
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY reported_at DESC
      LIMIT 1;
    `;

    const res = await this.pool.query(query, [pandalId]);
    if (res.rows.length === 0) return null;
    return mapDbToCrowdReport(res.rows[0]);
  }
}

export class InMemoryCrowdReportRepository implements ICrowdReportRepository {
  private reports: CrowdReport[] = [];

  async create(input: CreateCrowdReportInput): Promise<CrowdReport> {
    const crowdScore = crowdLevelToScore(input.crowdLevel);
    const report: CrowdReport = {
      id: `cr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pandalId: input.pandalId,
      crowdLevel: input.crowdLevel,
      crowdScore,
      queueMinutes: input.queueMinutes ?? 15,
      confidence: input.confidence ?? 0.8,
      source: input.source || 'USER',
      reportedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7200000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.reports.push(report);
    return { ...report };
  }

  async getLatestForPandal(pandalId: string): Promise<CrowdReport | null> {
    const now = Date.now();
    const filtered = this.reports.filter((r) => {
      if (r.pandalId !== pandalId) return false;
      if (r.expiresAt && new Date(r.expiresAt).getTime() <= now) return false;
      return true;
    });
    if (filtered.length === 0) return null;
    filtered.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    return { ...filtered[0] };
  }
}
