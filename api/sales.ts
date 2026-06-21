import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient } from './supabase';

const supabase = createSupabaseClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('sales')
      .select('id, sum, payment_method, time');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
}
