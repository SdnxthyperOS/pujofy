import { FastifyInstance } from 'fastify';
import { CrowdController } from '../controllers/crowdController.js';

export async function crowdRoutes(fastify: FastifyInstance, options: { controller: CrowdController }) {
  const { controller } = options;

  fastify.post('/api/crowd/report', controller.submitCrowdReport);
}
