import { GraphQLClient } from 'graphql-request';

export const gql = async (query) => {
  const response = await fetch(`./api/graph`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: query,
  })
  const data = await response.json();
  return data.result;
}

export const graph = async (query, variables) => {

  const hygraph = new GraphQLClient(
    'https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/clxf60hv1019o07w8rgr6i90e/master',
    {
      headers: {
        Authorization: `Bearer ${process.env.HYGRAPH}`,
      },
    }
  );

  try {
    const result = await hygraph.request(query, variables);
    return result;
  } catch (error) {
    console.error('Hygraph Error:', error.message);
    return ({ error: error.message });
  }

}