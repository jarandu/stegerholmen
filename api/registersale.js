import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const soldItemsData = soldItems.flatMap(item =>
      Array.from({ length: item.quantity }).map(() => ({
        sale_id: sale.id,
        product_id: item.product.id,
        price: parseFloat(item.product.price)
      }))
    );

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
}