import { GraphQLClient } from 'graphql-request';

export default async function handler(request, response) {

  const hygraph = new GraphQLClient(
    'https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/clxf60hv1019o07w8rgr6i90e/master',
    {
      headers: {
        Authorization: `Bearer ${process.env.HYGRAPH}`,
      },
    }
  );

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