import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.bulle26_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.bulle26_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase URL or service role key');
  }

  return createClient(url, key);
}
