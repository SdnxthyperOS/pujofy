import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const envSchema = z.object({
  PORT: z.string().transform((v) => parseInt(v, 10)).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().default('postgres://pujofy_user:pujofy_password@localhost:5432/pujofy_db'),
  MAPBOX_ACCESS_TOKEN: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
