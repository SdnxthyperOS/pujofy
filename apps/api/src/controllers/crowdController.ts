import { FastifyRequest, FastifyReply } from 'fastify';
import { CrowdService } from '../services/crowdService.js';
import { crowdReportBodySchema } from '../schemas/pandal.schema.js';

export class CrowdController {
  constructor(private crowdService: CrowdService) {}

  submitCrowdReport = async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = crowdReportBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid crowd report payload',
        details: parseResult.error.flatten(),
      });
    }

    try {
      const report = await this.crowdService.reportCrowd(parseResult.data);
      return reply.status(201).send({
        message: 'Crowd report submitted successfully',
        data: report,
      });
    } catch (err: any) {
      return reply.status(404).send({
        error: err.message || 'Failed to submit crowd report',
      });
    }
  };
}
