import pg from 'pg';

async function main() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();
  const res = await client.query('SELECT * FROM clinical.inpatient_wards');
  console.log('Inpatient wards:', JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
