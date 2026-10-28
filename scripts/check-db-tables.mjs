import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  const countRes = await client.query(`
    SELECT count(*) as total_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log('Total public tables in live DB:', countRes.rows[0].total_tables);

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('\n--- Domain Breakdown of DB Tables ---');
  const clinical = tablesRes.rows.filter(r => /patient|encounter|opd|ipd|clinical|prescription|lab|radiology|bed|vital|doctor|nurse|mrd|ot_|triage/i.test(r.table_name));
  const pharmacy = tablesRes.rows.filter(r => /pharmacy|drug|inventory|medication|batch|supplier|dispens/i.test(r.table_name));
  const billing = tablesRes.rows.filter(r => /billing|invoice|payment|receipt|refund|tariff|ledger|claim|tpa|pricing|charge/i.test(r.table_name));
  const company = tablesRes.rows.filter(r => /company|tenant|platform|godmode|whistle|cartel|honeytoken|steganography|fraud/i.test(r.table_name));
  const core = tablesRes.rows.filter(r => /user|role|session|auth|audit|credential|membership|branch|outbox/i.test(r.table_name));

  console.log(`Clinical/EHR Tables: ${clinical.length}`);
  console.log(`Pharmacy/Inventory Tables: ${pharmacy.length}`);
  console.log(`Billing/TPA/Finance Tables: ${billing.length}`);
  console.log(`Company/Platform/Godmode Tables: ${company.length}`);
  console.log(`Core/Auth/Security Tables: ${core.length}`);

  console.log('\nSample Clinical Tables:');
  clinical.slice(0, 15).forEach(r => console.log('  -', r.table_name));

  console.log('\nSample Billing Tables:');
  billing.slice(0, 15).forEach(r => console.log('  -', r.table_name));

  console.log('\nSample Pharmacy Tables:');
  pharmacy.slice(0, 15).forEach(r => console.log('  -', r.table_name));

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
