import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHygraphClient } from './hygraph';

interface HygraphSale {
  soldItems: Array<{
    price: number;
    product: {
      name: string;
      category: string;
    };
  }>;
  paymentMethod: string;
  text: string | null;
  sum: number;
  time: string;
}

interface GetAllSalesResult {
  sales: HygraphSale[];
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const hygraph = createHygraphClient();

  let allItems: HygraphSale[] = [];
  let skip = 0;
  let hasMore = true;
  const itemsPerPage = 100;

  const query = `
    query GetAllSales($first: Int!, $skip: Int!) {
      sales(orderBy: time_DESC, first: $first, skip: $skip) {
        soldItems {
          price
          product {
            name
            category
          }
        }
        paymentMethod
        text
        sum
        time
      }
    }
  `;

  while (hasMore) {
    console.log('hasMore', hasMore, 'skip', skip, 'length', allItems.length);
    try {
      const result = await hygraph.request<GetAllSalesResult>(query, {
        first: itemsPerPage,
        skip,
      });
      allItems = allItems.concat(result.sales);
      skip += itemsPerPage;
      console.log('result', result.sales.length);
      hasMore = result.sales.length === itemsPerPage;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hygraph error';
      console.error('Hygraph Error:', message);
      return response.status(500).json({ error: message });
    }
  }

  return response.status(200).json(allItems);
}
