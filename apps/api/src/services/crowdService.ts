import { CreateCrowdReportInput, ICrowdReportRepository } from '../repositories/crowdReportRepository.js';
import { IPandalRepository } from '../repositories/pandalRepository.js';
import { CrowdReport } from '@pujofy/types';

export class CrowdService {
  constructor(
    private crowdRepo: ICrowdReportRepository,
    private pandalRepo: IPandalRepository
  ) {}

  async reportCrowd(input: CreateCrowdReportInput): Promise<CrowdReport> {
    const pandal = await this.pandalRepo.findById(input.pandalId);
    if (!pandal) {
      throw new Error(`Pandal with ID ${input.pandalId} not found`);
    }

    return this.crowdRepo.create(input);
  }

  async getLatestReport(pandalId: string): Promise<CrowdReport | null> {
    return this.crowdRepo.getLatestForPandal(pandalId);
  }
}
