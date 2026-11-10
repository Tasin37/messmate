import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getPool() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/mess_manager';
  return new Pool({
    connectionString,
    max: parseInt(process.env.DATABASE_POOL_MAX || '5', 10),
  });
}

export async function runMigrations(direction = 'up') {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('Connecting to database...');
    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const migrationsDir = path.resolve(__dirname, '../../../db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found at', migrationsDir);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows: appliedRows } = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version ASC'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.version));

    if (direction === 'status') {
      console.log('--- Migration Status ---');
      for (const file of files) {
        const isApplied = appliedSet.has(file);
        console.log(`[${isApplied ? 'APPLIED' : 'PENDING'}] ${file}`);
      }
      return;
    }

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Successfully applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply migration: ${file}`, err);
        throw err;
      }
    }

    console.log('All migrations applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

// CLI execution
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const command = process.argv[2] || 'up';
  runMigrations(command).catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}
