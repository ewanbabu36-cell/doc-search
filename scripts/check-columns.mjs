import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  const q = async (schema, tbl) => {
    const res = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = '${tbl}' ORDER BY ordinal_position;`);
    console.log(`${schema}.${tbl} (${res.rows.length} cols):`, res.rows.map(r => r.column_name).join(', '));
  };
  await q('core', 'tenants');
  await q('core', 'branches');
  await q('company', 'products');
  await q('company', 'plans');
  await q('company', 'partner_profiles');
  await q('company', 'subscriptions');
  await q('company', 'licenses');
  await q('clinical', 'consultations');
  await q('clinical', 'investigation_orders');
  await q('clinical', 'billing_invoices');
  await pool.end();
}

main().catch(console.error);
