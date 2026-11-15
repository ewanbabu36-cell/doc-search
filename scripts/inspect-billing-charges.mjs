import pg from 'pg';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  const c1 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'clinical' AND table_name = 'billing_charges'
    ORDER BY ordinal_position
  `);
  console.log('billing_charges columns:', c1.rows.map(r => r.column_name));

  const countChg = await client.query(`SELECT count(*), status FROM clinical.billing_charges GROUP BY status`);
  console.log('billing_charges count by status:', countChg.rows);

  const hasItems = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'clinical' AND table_name = 'billing_charge_items'
    ) as exists
  `);
  console.log('has billing_charge_items table:', hasItems.rows[0].exists);

  if (hasItems.rows[0].exists) {
    const c2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'clinical' AND table_name = 'billing_charge_items'
      ORDER BY ordinal_position
    `);
    console.log('billing_charge_items columns:', c2.rows.map(r => r.column_name));
  }

  await client.end();
}

main().catch(console.error);
