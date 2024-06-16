import { sql } from '@vercel/postgres';
 
export default async function handler(request, response) {
  const { table, fields } = request.body;
  const fieldNames = Object.keys(fields);
  const fieldValues = Object.values(fields).map(value => `'${value}'`);
  const query = `INSERT INTO products (${fieldNames.join(', ')}) VALUES (${fieldValues.join(', ')})`;

  console.log('query:', query);

  try {
    const result = await sql`${query}`;
    console.log('Inserted successfully:', result);
    return response.status(200).json({ result });
  } catch (error) {
    console.error('SQL Error:', error.message);
    return response.status(500).json({ error: error.message });
  }
}