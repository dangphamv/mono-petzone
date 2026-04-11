import { Client } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';

// Load .env for local dev (Railway injects env vars directly)
config({ path: resolve(__dirname, '..', '..', '.env') });

const POOLER_HOSTS = [
  'aws-0-ap-southeast-1', 'aws-1-ap-northeast-1', 'aws-0-us-east-1',
  'aws-0-us-west-1', 'aws-0-eu-west-1', 'aws-0-eu-central-1',
  'aws-0-ap-south-1', 'aws-0-us-east-2', 'aws-0-ap-northeast-1',
  'aws-1-us-east-1', 'aws-1-eu-west-1', 'aws-1-ap-southeast-1',
];

function findMigrationsDir(): string | null {
  // Try multiple resolution strategies
  const candidates = [
    join(__dirname, '..', '..', '..', '..', 'supabase', 'migrations'),  // local: dist/scripts/ → repo root
    join(process.cwd(), 'supabase', 'migrations'),                       // Railway: cwd = repo root
    join(process.cwd(), '..', '..', 'supabase', 'migrations'),           // Railway: cwd = apps/api
  ];
  return candidates.find((d) => existsSync(d)) || null;
}

async function tryConnect(url: string): Promise<Client | null> {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    return client;
  } catch {
    return null;
  }
}

async function connectDb(): Promise<Client | null> {
  // Option 1: Full DB URL (recommended for Railway)
  if (process.env['SUPABASE_DB_URL']) {
    const client = await tryConnect(process.env['SUPABASE_DB_URL']);
    if (client) {
      console.warn('[migrate] Connected via SUPABASE_DB_URL');
      return client;
    }
    console.error('[migrate] SUPABASE_DB_URL is set but connection failed');
    return null;
  }

  // Option 2: Derive from SUPABASE_URL + SUPABASE_DB_PASSWORD (local dev)
  const supabaseUrl = process.env['SUPABASE_URL'];
  const dbPassword = process.env['SUPABASE_DB_PASSWORD'];
  if (!supabaseUrl || !dbPassword) return null;

  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) return null;
  const ref = match[1];
  const encodedPw = encodeURIComponent(dbPassword);

  for (const host of POOLER_HOSTS) {
    const url = `postgresql://postgres.${ref}:${encodedPw}@${host}.pooler.supabase.com:6543/postgres`;
    console.warn(`[migrate] Trying ${host}...`);
    const client = await tryConnect(url);
    if (client) {
      console.warn(`[migrate] Connected via ${host} pooler`);
      return client;
    }
  }

  return null;
}

async function migrate() {
  const migrationsDir = findMigrationsDir();
  if (!migrationsDir) {
    console.warn('[migrate] supabase/migrations/ not found, skipping');
    return;
  }
  console.warn(`[migrate] Migrations dir: ${migrationsDir}`);

  const client = await connectDb();
  if (!client) {
    console.warn('[migrate] Could not connect. Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD');
    return;
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows: applied } = await client.query('SELECT name FROM _migrations ORDER BY name');

    // First run: seed tracking table with migrations already applied to the DB
    if (applied.length === 0) {
      const { rows: tables } = await client.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'`,
      );
      if (tables.length > 0) {
        const allFiles = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
        const lastFile = allFiles[allFiles.length - 1];
        const alreadyApplied = allFiles.filter((f) => f !== lastFile);
        for (const f of alreadyApplied) {
          await client.query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
        }
        console.warn(`[migrate] Seeded ${alreadyApplied.length} existing migrations`);
        applied.push(...alreadyApplied.map((name) => ({ name })));
      }
    }

    const appliedSet = new Set(applied.map((r: { name: string }) => r.name));
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
    const pending = files.filter((f) => !appliedSet.has(f));

    if (!pending.length) {
      console.warn('[migrate] No pending migrations');
      return;
    }

    for (const file of pending) {
      const sql = await readFile(join(migrationsDir, file), 'utf-8');
      console.warn(`[migrate] Applying ${file}...`);
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.warn(`[migrate] Applied ${file}`);
    }

    console.warn(`[migrate] ${pending.length} migration(s) applied`);
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err.message);
  process.exit(1);
});
