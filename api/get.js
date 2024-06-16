import { sql } from '@vercel/postgres';
 
export default async function handler(request, response) {
  const table = request.body;
  try {
    const result = await sql`SELECT * FROM products`;
    return response.status(200).json({ result });
  }
  catch (error) {
    console.error('SQL Error:', error.message);
    return response.status(500).json({ error: error.message });
  }
}