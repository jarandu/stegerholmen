import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHygraphClient } from './hygraph';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const query = request.body as string;
  const hygraph = createHygraphClient();

  try {
    const result = await hygraph.request(query);
    return response.status(200).json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hygraph error';
    console.error('Hygraph Error:', message);
    return response.status(500).json({ error: message });
  }
}
