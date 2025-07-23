import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const todayStart = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    
    const tomorrow = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate() + 1));
    const yyyy2 = tomorrow.getUTCFullYear();
    const mm2 = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
    const dd2 = String(tomorrow.getUTCDate()).padStart(2, '0');
    const tomorrowStart = `${yyyy2}-${mm2}-${dd2}T00:00:00.000Z`;
    
    const { data, error } = await supabase
      .from('sold_items')
      .select('*')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart);
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 