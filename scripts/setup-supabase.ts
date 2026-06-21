import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import pg from 'pg';

dotenv.config({ path: '.env.local', override: true });

const url = process.env.SUPABASE_URL || process.env.bulle26_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.bulle26_SUPABASE_SERVICE_ROLE_KEY;
const postgresUrl =
  process.env.POSTGRES_URL_NON_POOLING || process.env.bulle26_POSTGRES_URL_NON_POOLING;

async function applySchema() {
  if (!postgresUrl) {
    throw new Error('Missing POSTGRES_URL_NON_POOLING or bulle26_POSTGRES_URL_NON_POOLING');
  }

  const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  const client = new pg.Client({
    connectionString: postgresUrl.replace('sslmode=require', 'uselibpqcompat=true&sslmode=require'),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('Schema applied successfully');
}

async function testConnection() {
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, serviceKey);
  const tables = ['products', 'sales', 'sold_items'] as const;

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`${table}: ${count ?? 0} rows`);
  }
}

try {
  console.log('Applying schema...');
  await applySchema();
  console.log('Testing connection...');
  await testConnection();
  console.log('Supabase setup complete');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Setup failed';
  console.error('Setup failed:', message);
  process.exit(1);
}
