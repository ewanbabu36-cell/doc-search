import pg from 'pg';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const query = process.argv[2];

if (!query) {
  console.error('Usage: node scripts/db-query.mjs "<SQL_QUERY>"');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DB_URL });
try {
  await client.connect();
  const res = await client.query(query);
  console.log(JSON.stringify(res.rows, null, 2));
} catch (err) {
  console.error('Query error:', err);
  process.exit(1);
} finally {
  await client.end();
}
