import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'clinical'");
  console.log(`Found ${res.rows.length} tables in clinical schema:`);
  console.log(res.rows.map(r => r.table_name).sort().join(', '));
  await client.end();
}

main().catch(console.error);
