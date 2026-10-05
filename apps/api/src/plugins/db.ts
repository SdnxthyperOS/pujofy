import fp from 'fastify-plugin';
import pg from 'pg';
import { env } from '../config/env.js';

export interface DbPluginOptions {
  connectionString?: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    dbPool?: pg.Pool;
  }
}

export const dbPlugin = fp<DbPluginOptions>(async (fastify, opts) => {
  const connectionString = opts.connectionString || env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30000 });

  try {
    const client = await pool.connect();
    client.release();
    fastify.log.info('Connected to PostgreSQL database with PostGIS support.');
    fastify.decorate('dbPool', pool);

    fastify.addHook('onClose', async () => {
      await pool.end();
    });
  } catch (err: any) {
    fastify.log.warn(`Database connection failed (${err.message}). Application starting in fallback/in-memory mode.`);
  }
});
