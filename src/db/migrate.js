const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const migrationsDir = path.resolve(process.cwd(), 'migrations');

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  return process.env.DATABASE_URL;
}

function checksumSql(sql) {
  return crypto.createHash('sha256').update(sql).digest('hex');
}

async function listMigrationFiles() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
    .sort();
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      checksum text NOT NULL,
      executed_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT version, checksum FROM schema_migrations');

  return new Map(result.rows.map((row) => [row.version, row.checksum]));
}

async function runMigration(client, fileName, sql, checksum) {
  await client.query('BEGIN');

  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
      [fileName, checksum]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function migrate() {
  const pool = new Pool({
    connectionString: requireDatabaseUrl()
  });

  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    const appliedMigrations = await getAppliedMigrations(client);
    const migrationFiles = await listMigrationFiles();

    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationsDir, fileName);
      const sql = await fs.readFile(filePath, 'utf8');
      const checksum = checksumSql(sql);
      const appliedChecksum = appliedMigrations.get(fileName);

      if (appliedChecksum) {
        if (appliedChecksum !== checksum) {
          throw new Error(`Migration checksum mismatch: ${fileName}`);
        }

        console.log(`Skipping already applied migration: ${fileName}`);
        continue;
      }

      console.log(`Running migration: ${fileName}`);
      await runMigration(client, fileName, sql, checksum);
      console.log(`Applied migration: ${fileName}`);
    }

    console.log('Database migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed', {
    name: error.name,
    code: error.code,
    message: error.message,
    errors: error.errors?.map((item) => ({
      code: item.code,
      address: item.address,
      port: item.port,
      message: item.message
    })),
    stack: error.stack
  });
  process.exit(1);
});
