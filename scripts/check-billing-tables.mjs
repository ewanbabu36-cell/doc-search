import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'clinical' AND table_name LIKE '%bill%'
    ORDER BY table_name;
  `);
  console.log('Billing tables in clinical schema:');
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
