import { Pandal, CrowdReport } from '@pujofy/types';
import pg from 'pg';
import { mapDbToPandal } from '../models/pandal.model.js';
import { mapDbToCrowdReport } from '../models/crowdReport.model.js';
import { calculateHaversineDistanceMeters } from '../utils/haversine.js';
import { ICrowdReportRepository } from './crowdReportRepository.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface NearbyPandalQueryResult {
  pandal: Pandal;
  distanceMeters: number;
  latestCrowdReport: CrowdReport | null;
}

export interface IPandalRepository {
  findById(id: string): Promise<Pandal | null>;
  findNearby(lat: number, lng: number, radiusMeters: number): Promise<NearbyPandalQueryResult[]>;
  findAll(): Promise<Pandal[]>;
}

export class PgPandalRepository implements IPandalRepository {
  constructor(private pool: pg.Pool) {}

  async findById(id: string): Promise<Pandal | null> {
    const res = await this.pool.query('SELECT * FROM pandals WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapDbToPandal(res.rows[0]);
  }

  async findAll(): Promise<Pandal[]> {
    const res = await this.pool.query('SELECT * FROM pandals WHERE is_active = true ORDER BY name ASC');
    return res.rows.map(mapDbToPandal);
  }

  async findNearby(lat: number, lng: number, radiusMeters: number): Promise<NearbyPandalQueryResult[]> {
    const query = `
      SELECT 
        p.*,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters,
        cr.id AS cr_id,
        cr.pandal_id AS cr_pandal_id,
        cr.crowd_level AS cr_crowd_level,
        cr.crowd_score AS cr_crowd_score,
        cr.queue_minutes AS cr_queue_minutes,
        cr.confidence AS cr_confidence,
        cr.source AS cr_source,
        cr.reported_at AS cr_reported_at,
        cr.expires_at AS cr_expires_at,
        cr.created_at AS cr_created_at
      FROM pandals p
      LEFT JOIN LATERAL (
        SELECT * FROM crowd_reports 
        WHERE pandal_id = p.id 
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        ORDER BY reported_at DESC 
        LIMIT 1
      ) cr ON true
      WHERE p.is_active = true
        AND ST_DWithin(
          p.location, 
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 
          $3
        )
      ORDER BY distance_meters ASC;
    `;

    const res = await this.pool.query(query, [lat, lng, radiusMeters]);

    return res.rows.map((row) => {
      const pandal = mapDbToPandal(row);
      const distanceMeters = Math.round(parseFloat(row.distance_meters));

      let latestCrowdReport: CrowdReport | null = null;
      if (row.cr_id) {
        latestCrowdReport = mapDbToCrowdReport({
          id: row.cr_id,
          pandal_id: row.cr_pandal_id,
          crowd_level: row.cr_crowd_level,
          crowd_score: row.cr_crowd_score,
          queue_minutes: row.cr_queue_minutes,
          confidence: row.cr_confidence,
          source: row.cr_source,
          reported_at: row.cr_reported_at,
          expires_at: row.cr_expires_at,
          created_at: row.cr_created_at,
        });
      }

      return {
        pandal,
        distanceMeters,
        latestCrowdReport,
      };
    });
  }
}

export class InMemoryPandalRepository implements IPandalRepository {
  private pandals: Pandal[] = [];
  private crowdReportsMap: Map<string, CrowdReport> = new Map();

  constructor(
    initialData?: { pandals: Pandal[]; reports?: CrowdReport[] },
    private crowdRepo?: ICrowdReportRepository
  ) {
    if (initialData) {
      this.pandals = [...initialData.pandals];
      if (initialData.reports) {
        initialData.reports.forEach((r) => this.crowdReportsMap.set(r.pandalId, r));
      }
    } else {
      this.loadSeedData();
    }
  }

  private loadSeedData() {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const seedPath = path.resolve(__dirname, '../../../../data/seed/pandals.json');
      
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, 'utf-8');
        const items = JSON.parse(raw);
        items.forEach((item: any) => {
          const pandal: Pandal = {
            id: item.id,
            name: item.name,
            description: item.description,
            latitude: item.latitude,
            longitude: item.longitude,
            entranceLatitude: item.entranceLatitude ?? item.entrance_latitude,
            entranceLongitude: item.entranceLongitude ?? item.entrance_longitude,
            imageUrl: item.imageUrl || `/images/pandals/fallback.webp`,
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
          };
          this.pandals.push(pandal);

          if (item.crowd) {
            const report: CrowdReport = {
              id: `cr-${item.id}`,
              pandalId: item.id,
              crowdLevel: item.crowd.crowdLevel,
              crowdScore: item.crowd.crowdScore,
              queueMinutes: item.crowd.queueMinutes,
              confidence: item.crowd.confidence,
              source: item.crowd.source || 'USER',
              reportedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 7200000).toISOString(),
              createdAt: new Date().toISOString(),
            };
            this.crowdReportsMap.set(item.id, report);
          }
        });
      }
    } catch (e) {
      console.warn('Could not load seed JSON into InMemoryPandalRepository:', e);
    }
  }

  async findById(id: string): Promise<Pandal | null> {
    const p = this.pandals.find((item) => item.id === id);
    return p ? { ...p } : null;
  }

  async findAll(): Promise<Pandal[]> {
    return this.pandals.filter((p) => p.isActive);
  }

  async findNearby(lat: number, lng: number, radiusMeters: number): Promise<NearbyPandalQueryResult[]> {
    const results: NearbyPandalQueryResult[] = [];

    for (const p of this.pandals) {
      if (!p.isActive) continue;

      const dist = calculateHaversineDistanceMeters(lat, lng, p.latitude, p.longitude);
      if (dist <= radiusMeters) {
        let report: CrowdReport | null = null;
        if (this.crowdRepo) {
          report = await this.crowdRepo.getLatestForPandal(p.id);
        }
        if (!report) {
          report = this.crowdReportsMap.get(p.id) || null;
          if (report && report.expiresAt && new Date(report.expiresAt).getTime() <= Date.now()) {
            report = null;
          }
        }

        results.push({
          pandal: { ...p },
          distanceMeters: dist,
          latestCrowdReport: report ? { ...report } : null,
        });
      }
    }

    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results;
  }

  public setCrowdRepo(crowdRepo: ICrowdReportRepository) {
    this.crowdRepo = crowdRepo;
  }

  public setCrowdReport(report: CrowdReport) {
    this.crowdReportsMap.set(report.pandalId, report);
  }
}
