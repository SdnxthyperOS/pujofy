import { FastifyInstance } from 'fastify';
import { RoutingController } from '../controllers/routingController.js';

export async function routingRoutes(
  fastify: FastifyInstance,
  options: { controller: RoutingController }
) {
  const { controller } = options;
  fastify.get('/api/routes', controller.getRoute);
}
