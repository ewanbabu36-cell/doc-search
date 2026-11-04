import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  for (const table of ['billing_service_catalog', 'billing_charges', 'billing_cashier_sessions', 'billing_price_lists']) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'clinical' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    console.log(`\n=== Columns of clinical.${table} ===`);
    console.table(res.rows);
  }

  await client.end();
}

main().catch(console.error);
