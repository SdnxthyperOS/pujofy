import { FastifyInstance } from 'fastify';
import { PandalController } from '../controllers/pandalController.js';

export async function pandalRoutes(fastify: FastifyInstance, options: { controller: PandalController }) {
  const { controller } = options;

  fastify.get('/api/pandals/nearby', controller.getNearbyPandals);
  fastify.get('/api/pandals/:id', controller.getPandalById);
}
