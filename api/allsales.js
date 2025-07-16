import { hygraphClient } from '../src/utils.js';

export default async function handler(request, response) {

  const hygraph = hygraphClient(process);

  let allItems = [];
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
          }
        }
        paymentMethod
        text
        sum
        time
        id
      }
    }
  `;

  while(hasMore) {
    console.log("hasMore", hasMore, "skip", skip, "length", allItems.length)
    try {
      const result = await hygraph.request(query, {
        first: itemsPerPage,
        skip: skip,
      });
      allItems = allItems.concat(result.sales);
      skip += itemsPerPage;
      console.log("result",result.sales.length)
      hasMore = result.sales.length === itemsPerPage;
      // await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Hygraph Error:', error.message);
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(200).json(allItems);
}