import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();
  const res = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'clinical'");
  console.log('Clinical tables in Postgres:', res.rows[0].count);
  await client.end();
}

main().catch(console.error);
