import pg from 'pg';
import fs from 'node:fs';

if (fs.existsSync('.env.local')) {
  try {
    process.loadEnvFile('.env.local');
  } catch {}
} else if (fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {}
}

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/mess_manager';

    pool = new Pool({
      connectionString,
      max: parseInt(process.env.DATABASE_POOL_MAX || '5', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected idle client error in PostgreSQL pool', err);
    });
  }
  return pool;
}

/**
 * Execute a single parameterized query safely using the pool
 */
export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

/**
 * Execute a callback within an isolated transaction on a dedicated client.
 * Automatically commits on success and rolls back on error.
 */
export async function withTransaction(callback) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
