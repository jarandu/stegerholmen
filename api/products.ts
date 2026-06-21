import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient } from './supabase';

const supabase = createSupabaseClient();

interface CreateProductBody {
  name: string;
  price: number | string;
  slug: string;
  category?: string;
  image?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return handleCreate(req, res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, search, limit = '100', offset = '0' } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
      .range(parseInt(String(offset)), parseInt(String(offset)) + parseInt(String(limit)) - 1);

    if (category) {
      query = query.eq('category', String(category));
    }

    if (search) {
      query = query.or(`name.ilike.%${String(search)}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body as { products?: CreateProductBody[] } | undefined;
    const { products } = body ?? {};

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array required' });
    }

    const rows = products.map((product) => {
      if (!product.name || product.price === undefined || !product.slug) {
        throw new Error(`Ugyldig produkt: ${product.name || 'ukjent'}`);
      }

      return {
        name: product.name.trim(),
        price: parseFloat(String(product.price)),
        slug: product.slug.trim(),
        category: product.category || 'Dryck',
        image: product.image || `${product.slug.trim()}.jpg`,
        updated_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase.from('products').insert(rows).select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ products: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create products';
    console.error('API error:', error);
    res.status(400).json({ error: message });
  }
}
