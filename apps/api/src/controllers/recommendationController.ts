import { FastifyRequest, FastifyReply } from 'fastify';
import { RecommendationService } from '../services/recommendationService.js';
import { recommendationQuerySchema } from '../schemas/pandal.schema.js';

export class RecommendationController {
  constructor(private recService: RecommendationService) {}

  getRecommendations = async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = recommendationQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid recommendation query parameters',
        details: parseResult.error.flatten(),
      });
    }

    const { lat, lng, mode, radius } = parseResult.data;
    const result = await this.recService.getNextRecommendations(lat, lng, mode, radius);
    return reply.send(result);
  };
}
