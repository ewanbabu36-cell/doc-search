import pg from 'pg';

async function check() {
  const client = new pg.Client('postgresql://postgres:password@127.0.0.1:5432/docsearch');
  await client.connect();

  const tables = [
    'procurement_vendors',
    'procurement_items',
    'purchase_orders',
    'purchase_requisitions',
    'surgical_procedures',
    'prescription_templates',
    'pharmacy_khata_ledger',
    'pharmacy_stock_movements',
    'pharmacy_b2b_purchase_orders',
    'pharmacy_chronic_refill_radars',
    'pharmacy_generic_substitutions',
    'pharmacy_rtv_debit_notes',
    'surgery_concierge_leads',
    'surgery_emi_applications',
    'phlebotomist_fleets',
    'rcm_claim_scrub_logs'
  ];

  for (const t of tables) {
    const res = await client.query(`SELECT count(*) as count, tenant_id FROM "clinical"."${t}" GROUP BY tenant_id`);
    console.log(`${t}:`, res.rows);
  }

  await client.end();
}

check().catch(console.error);
