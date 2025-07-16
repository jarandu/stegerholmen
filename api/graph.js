import { hygraphClient } from '../src/utils.js';

export default async function handler(request, response) {
  
  const query = request.body;
  const hygraph = hygraphClient(process);

  try {
    const result = await hygraph.request(query);
    return response.status(200).json({ result });
  } catch (error) {
    console.error('Hygraph Error:', error.message);
    return response.status(500).json({ error: error.message });
  }

}