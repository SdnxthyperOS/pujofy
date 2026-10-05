import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { dbPlugin } from './plugins/db.js';
import { IPandalRepository, PgPandalRepository, InMemoryPandalRepository } from './repositories/pandalRepository.js';
import { ICrowdReportRepository, PgCrowdReportRepository, InMemoryCrowdReportRepository } from './repositories/crowdReportRepository.js';
import { PandalService } from './services/pandalService.js';
import { CrowdService } from './services/crowdService.js';
import { RecommendationService } from './services/recommendationService.js';
import { PandalController } from './controllers/pandalController.js';
import { CrowdController } from './controllers/crowdController.js';
import { RecommendationController } from './controllers/recommendationController.js';
import { IRoutingService, MapboxRoutingService } from './services/routingService.js';
import { RoutingController } from './controllers/routingController.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { pandalRoutes } from './routes/pandalRoutes.js';
import { crowdRoutes } from './routes/crowdRoutes.js';
import { recommendationRoutes } from './routes/recommendationRoutes.js';
import { routingRoutes } from './routes/routingRoutes.js';

export interface AppOptions {
  pandalRepo?: IPandalRepository;
  crowdRepo?: ICrowdReportRepository;
  routingService?: IRoutingService;
  skipDbPlugin?: boolean;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { level: 'info' },
  });

  await app.register(cors, { origin: true });

  if (!options.skipDbPlugin) {
    await app.register(dbPlugin);
  }

  let pandalRepo: IPandalRepository;
  let crowdRepo: ICrowdReportRepository;

  if (options.pandalRepo && options.crowdRepo) {
    pandalRepo = options.pandalRepo;
    crowdRepo = options.crowdRepo;
    if (pandalRepo instanceof InMemoryPandalRepository) {
      pandalRepo.setCrowdRepo(crowdRepo);
    }
  } else if (app.dbPool) {
    pandalRepo = new PgPandalRepository(app.dbPool);
    crowdRepo = new PgCrowdReportRepository(app.dbPool);
  } else {
    crowdRepo = new InMemoryCrowdReportRepository();
    pandalRepo = new InMemoryPandalRepository(undefined, crowdRepo);
  }

  const routingService = options.routingService ?? new MapboxRoutingService();

  const pandalService = new PandalService(pandalRepo);
  const crowdService = new CrowdService(crowdRepo, pandalRepo);
  const recService = new RecommendationService(pandalRepo);

  const pandalController = new PandalController(pandalService);
  const crowdController = new CrowdController(crowdService);
  const recController = new RecommendationController(recService);
  const routingController = new RoutingController(routingService);

  await app.register(healthRoutes);
  await app.register(pandalRoutes, { controller: pandalController });
  await app.register(crowdRoutes, { controller: crowdController });
  await app.register(recommendationRoutes, { controller: recController });
  await app.register(routingRoutes, { controller: routingController });

  return app;
}
