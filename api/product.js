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
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ error: 'Slug parameter required' });
    }
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
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
