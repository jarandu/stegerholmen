import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient } from './supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createSupabaseClient();
    console.log('Testing Supabase connection...');
    console.log('Testing table access...');

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    console.log('Products query result:', { data: products, error: productsError });

    const { data: sales, error: salesError } = await supabase.from('sales').select('*').limit(5);

    console.log('Sales query result:', { data: sales, error: salesError });

    const { data: soldItems, error: soldItemsError } = await supabase
      .from('sold_items')
      .select('*')
      .limit(5);

    console.log('Sold items query result:', { data: soldItems, error: soldItemsError });

    const { count: productsCount, error: productsCountError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: salesCount, error: salesCountError } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });

    const { count: soldItemsCount, error: soldItemsCountError } = await supabase
      .from('sold_items')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      success: true,
      message: 'Supabase connection working',
      tables: {
        products: {
          count: productsCount,
          sample: products?.slice(0, 2) || [],
          error: productsError?.message,
        },
        sales: {
          count: salesCount,
          sample: sales?.slice(0, 2) || [],
          error: salesError?.message,
        },
        sold_items: {
          count: soldItemsCount,
          sample: soldItems?.slice(0, 2) || [],
          error: soldItemsError?.message,
        },
      },
      errors: {
        productsCount: productsCountError?.message,
        salesCount: salesCountError?.message,
        soldItemsCount: soldItemsCountError?.message,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Test failed';
    console.error('Test error:', error);
    res.status(500).json({
      error: 'Test failed',
      details: message,
    });
  }
}
