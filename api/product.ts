import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient } from './supabase';

const supabase = createSupabaseClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: 'Slug parameter required' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', String(slug))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
