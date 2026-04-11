import { Client } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function migrate() {
  const dbUrl = process.env['SUPABASE_DB_URL'];
  if (!dbUrl) {
    console.warn('[migrate] SUPABASE_DB_URL not set, skipping migrations');
    return;
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // Create tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Get already applied
    const { rows: applied } = await client.query('SELECT name FROM _migrations ORDER BY name');
    const appliedSet = new Set(applied.map((r: { name: string }) => r.name));

    // Read migration files
    const migrationsDir = join(__dirname, '..', '..', '..', 'supabase', 'migrations');
    let files: string[];
    try {
      files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
    } catch {
      console.warn(`[migrate] No migrations directory found at ${migrationsDir}`);
      return;
    }

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
