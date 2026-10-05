import { FastifyRequest, FastifyReply } from 'fastify';
import { IRoutingService } from '../services/routingService.js';
import { routeQuerySchema } from '../schemas/routing.schema.js';

export class RoutingController {
  constructor(private routingService: IRoutingService) {}

  getRoute = async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = routeQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: parseResult.error.flatten(),
      });
    }

    const { originLat, originLng, destinationLat, destinationLng } = parseResult.data;

    try {
      const route = await this.routingService.getRoute(
        { lat: originLat, lng: originLng },
        { lat: destinationLat, lng: destinationLng }
      );

      return reply.send(route);
    } catch (error: any) {
      const isFeasibleError = error?.message === 'No feasible walking route found';
      const statusCode = isFeasibleError ? 422 : 500;
      return reply.status(statusCode).send({
        success: false,
        error: error?.message || 'Failed to calculate walking route',
      });
    }
  };
}
