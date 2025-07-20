import { createClient } from '@supabase/supabase-js';

// Debug: Check if environment variables are available
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'Not set');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get sales
    try {
      console.log('Starting to fetch sales...');
      
      // First, get all sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('time', { ascending: false });
      
      if (salesError) {
        console.error('Supabase error:', salesError);
        return res.status(500).json({ error: 'Database error', details: salesError.message });
      }
      
      console.log(`Found ${sales?.length || 0} sales`);
      
      if (!sales || sales.length === 0) {
        return res.status(200).json({ sales: [] });
      }
      
      // Get sold items in batches to avoid the fetch error
      console.log('Fetching sold items in batches...');
      const batchSize = 50; // Process in smaller batches
      let allSoldItems = [];
      
      for (let i = 0; i < sales.length; i += batchSize) {
        const batch = sales.slice(i, i + batchSize);
        const saleIds = batch.map(sale => sale.id);
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}, ${saleIds.length} sales`);
        
        const { data: batchSoldItems, error: batchError } = await supabase
          .from('sold_items')
          .select('*')
          .in('sale_id', saleIds);
        
        if (batchError) {
          console.error('Batch error:', batchError);
          return res.status(500).json({ error: 'Database error', details: batchError.message });
        }
        
        allSoldItems = allSoldItems.concat(batchSoldItems || []);
        
        // Small delay between batches to avoid overwhelming the connection
        if (i + batchSize < sales.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Found ${allSoldItems.length} sold items total`);
      
      // Get all product IDs from sold items
      const productIds = [...new Set(allSoldItems.map(item => item.product_id).filter(Boolean))];
      
      console.log(`Fetching ${productIds.length} products...`);
      
      // Get products in batches too
      let allProducts = [];
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batchProductIds = productIds.slice(i, i + batchSize);
        
        const { data: batchProducts, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', batchProductIds);
        
        if (productsError) {
          console.error('Products error:', productsError);
          return res.status(500).json({ error: 'Database error', details: productsError.message });
        }
        
        allProducts = allProducts.concat(batchProducts || []);
        
        if (i + batchSize < productIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Found ${allProducts.length} products`);
      
      // Create a map of products by ID
      const productsById = allProducts.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});
      
      // Group sold items by sale_id and add product info
      const soldItemsBySale = allSoldItems.reduce((acc, item) => {
        if (!acc[item.sale_id]) {
          acc[item.sale_id] = [];
        }
        acc[item.sale_id].push({
          ...item,
          product: productsById[item.product_id] || null
        });
        return acc;
      }, {});
      
      // Combine sales with their sold items
      const salesWithItems = sales.map(sale => ({
        ...sale,
        sold_items: soldItemsBySale[sale.id] || []
      }));
      
      console.log('Returning sales with items');
      res.status(200).json({ sales: salesWithItems });
      
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else if (req.method === 'POST') {
    // Create sale
    try {
      const { sum, paymentMethod, soldItems, text } = req.body;
      
      // Insert sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          sum: parseFloat(sum),
          payment_method: paymentMethod,
          time: new Date().toISOString(),
          text: text || null
        })
        .select()
        .single();
      
      if (saleError) {
        console.error('Sale creation error:', saleError);
        return res.status(500).json({ error: 'Failed to create sale', details: saleError.message });
      }
      
      // Insert sold items
      const soldItemsData = soldItems.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        price: parseFloat(item.product.price)
      }));
      
      const { error: itemsError } = await supabase
        .from('sold_items')
        .insert(soldItemsData);
      
      if (itemsError) {
        console.error('Sold items creation error:', itemsError);
        return res.status(500).json({ error: 'Failed to create sold items', details: itemsError.message });
      }
      
      res.status(201).json({ sale });
      
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
