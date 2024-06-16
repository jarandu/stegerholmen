import { GraphQLClient } from 'graphql-request';

export default async function handler(request, response) {
  
  const query = request.body;
  console.log('Query:', query)

  const hygraph = new GraphQLClient(
    'https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/clxf60hv1019o07w8rgr6i90e/master',
    {
      headers: {
        Authorization: `Bearer ${process.env.HYGRAPH}`,
      },
    }
  );

  try {
    const result = await hygraph.request(query);
    return response.status(200).json({ result });
  } catch (error) {
    console.error('Hygraph Error:', error.message);
    return response.status(500).json({ error: error.message });
  }

}