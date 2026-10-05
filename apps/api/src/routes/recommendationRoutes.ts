import { FastifyInstance } from 'fastify';
import { RecommendationController } from '../controllers/recommendationController.js';

export async function recommendationRoutes(
  fastify: FastifyInstance,
  options: { controller: RecommendationController }
) {
  const { controller } = options;

  fastify.get('/api/recommendations/next', controller.getRecommendations);
}
