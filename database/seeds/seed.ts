import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const dbUrl = process.env.DATABASE_URL || 'postgres://pujofy_user:pujofy_password@localhost:5432/pujofy_db';
  console.log(`Connecting to database: ${dbUrl}`);

  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    const seedSqlPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf-8');

    console.log('Executing seed SQL...');
    await pool.query(seedSql);
    console.log('Seed database executed successfully with 32 Puja pandals and crowd reports.');
  } catch (err) {
    console.error('Failed to seed database:', err);
  } finally {
    await pool.end();
  }
}

runSeed();
