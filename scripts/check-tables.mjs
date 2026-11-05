import pg from 'pg';
const { Client } = pg;

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();
  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name IN ('tenants', 'patients')
  `);
  console.log('Tables found:', res.rows);
  await client.end();
}
check();
