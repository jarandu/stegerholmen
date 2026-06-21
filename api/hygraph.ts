import { GraphQLClient } from 'graphql-request';

const HYGRAPH_ENDPOINT =
  'https://eu-west-2.cdn.hygraph.com/content/cmd6ao2hz03540dw05hvtf513/master';

export function createHygraphClient() {
  const token = process.env.HYGRAPH_25;

  if (!token) {
    throw new Error('Missing HYGRAPH_25 environment variable');
  }

  return new GraphQLClient(HYGRAPH_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
