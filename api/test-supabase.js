import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if tables exist
    console.log('Testing table access...');
    
    // Test products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    console.log('Products query result:', { data: products, error: productsError });
    
    // Test sales table
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .limit(5);
    
    console.log('Sales query result:', { data: sales, error: salesError });
    
    // Test sold_items table
    const { data: soldItems, error: soldItemsError } = await supabase
      .from('sold_items')
      .select('*')
      .limit(5);
    
    console.log('Sold items query result:', { data: soldItems, error: soldItemsError });
    
    // Get table counts
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
          error: productsError?.message
        },
        sales: {
          count: salesCount,
          sample: sales?.slice(0, 2) || [],
          error: salesError?.message
        },
        sold_items: {
          count: soldItemsCount,
          sample: soldItems?.slice(0, 2) || [],
          error: soldItemsError?.message
        }
      },
      errors: {
        productsCount: productsCountError?.message,
        salesCount: salesCountError?.message,
        soldItemsCount: soldItemsCountError?.message
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message
    });
  }
} 