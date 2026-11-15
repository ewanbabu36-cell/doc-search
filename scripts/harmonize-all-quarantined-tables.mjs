import pg from 'pg';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
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
    'rcm_claim_scrub_logs',
    'saas_communication_wallets',
    'saas_marketplace_addons',
    'corporate_tieups',
    'corporate_health_camps',
    'corporate_employee_census'
  ];

  console.log('=== HARMONIZING QUARANTINED CLINICAL TABLES ===\n');

  for (const t of tables) {
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'clinical' AND table_name = $1
      ) as exists
    `, [t]);

    if (!tableExists.rows[0].exists) {
      console.log(`Table clinical.${t} does not exist, skipping.`);
      continue;
    }

    const hasBranchCol = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'clinical' AND table_name = $1 AND column_name = 'branch_id'
      ) as exists
    `, [t]);

    let res;
    if (hasBranchCol.rows[0].exists) {
      res = await client.query(`
        UPDATE "clinical"."${t}"
        SET tenant_id = $1, branch_id = COALESCE(branch_id, $2)
        WHERE tenant_id != $1
      `, [CANONICAL_TENANT, CANONICAL_BRANCH]);
    } else {
      res = await client.query(`
        UPDATE "clinical"."${t}"
        SET tenant_id = $1
        WHERE tenant_id != $1
      `, [CANONICAL_TENANT]);
    }

    console.log(`✓ clinical.${t}: Updated ${res.rowCount} quarantined rows to canonical tenant.`);
  }

  console.log('\n--- Verifying Counts for Canonical Tenant ---');
  for (const t of tables) {
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'clinical' AND table_name = $1
      ) as exists
    `, [t]);
    if (tableExists.rows[0].exists) {
      const q = await client.query(`
        SELECT count(*) as total,
               count(*) FILTER (WHERE tenant_id = $1) as canonical_count
        FROM "clinical"."${t}"
      `, [CANONICAL_TENANT]);
      console.log(`clinical.${t}: Total = ${q.rows[0].total}, Canonical = ${q.rows[0].canonical_count}`);
    }
  }

  await client.end();
  console.log('\n=== SCOPE HARMONIZATION COMPLETE ===');
}

main().catch(console.error);
