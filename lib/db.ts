import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface SqlResult extends QueryResult {
  rows: any[];
}

export const sql = async <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<SqlResult & { rows: T[] }> => {
  const client = await pool.connect();
  try {
    // Build parameterized query with proper $1, $2, $3 syntax
    let query = '';
    for (let i = 0; i < strings.length; i++) {
      query += strings[i];
      if (i < values.length) {
        query += `$${i + 1}`;
      }
    }
    
    console.log('Query:', query);
    console.log('Values:', values);
    
    const result = await client.query(query, values);
    return result as SqlResult & { rows: T[] };
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    client.release();
  }
};
