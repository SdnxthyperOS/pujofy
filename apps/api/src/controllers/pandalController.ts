import { FastifyRequest, FastifyReply } from 'fastify';
import { PandalService } from '../services/pandalService.js';
import { nearbyQuerySchema, pandalParamsSchema } from '../schemas/pandal.schema.js';

export class PandalController {
  constructor(private pandalService: PandalService) {}

  getNearbyPandals = async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = nearbyQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: parseResult.error.flatten(),
      });
    }

    const { lat, lng, radius } = parseResult.data;
    const pandals = await this.pandalService.getNearbyPandals(lat, lng, radius);
    return reply.send({
      count: pandals.length,
      userLocation: { lat, lng },
      radiusMeters: radius,
      data: pandals,
    });
  };

  getPandalById = async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = pandalParamsSchema.safeParse(req.params);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid pandal ID format',
        details: parseResult.error.flatten(),
      });
    }

    const { id } = parseResult.data;
    const pandal = await this.pandalService.getPandalById(id);
    if (!pandal) {
      return reply.status(404).send({ error: 'Pandal not found' });
    }

    return reply.send({ data: pandal });
  };
}
