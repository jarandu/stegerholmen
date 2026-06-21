import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseClient } from './supabase.js';

interface CartProduct {
  id: string;
  price: number | string;
}

interface SoldItemInput {
  quantity: number;
  product: CartProduct;
}

interface RegisterSaleBody {
  sum: number | string;
  paymentMethod: string;
  soldItems: SoldItemInput[];
  text?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseClient();
    const { sum, paymentMethod, soldItems, text } = req.body as RegisterSaleBody;

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        sum: parseFloat(String(sum)),
        payment_method: paymentMethod,
        time: new Date().toISOString(),
        text: text || null,
      })
      .select()
      .single();

    if (saleError) {
      console.error('Sale creation error:', saleError);
      return res.status(500).json({ error: 'Failed to create sale', details: saleError.message });
    }

    const soldItemsData = soldItems.flatMap((item) =>
      Array.from({ length: item.quantity }).map(() => ({
        sale_id: sale.id,
        product_id: item.product.id,
        price: parseFloat(String(item.product.price)),
      }))
    );

    const { error: itemsError } = await supabase.from('sold_items').insert(soldItemsData);

    if (itemsError) {
      console.error('Sold items creation error:', itemsError);
      return res
        .status(500)
        .json({ error: 'Failed to create sold items', details: itemsError.message });
    }

    res.status(201).json({ sale });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', details: message });
  }
}
