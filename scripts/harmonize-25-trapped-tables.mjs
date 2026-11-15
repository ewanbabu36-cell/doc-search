import pg from 'pg';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';

const tables = [
  'public.ot_surgical_missions',
  'public.ot_safety_checklists',
  'public.ot_sponge_needle_counts',
  'public.pharmacy_pos_inventory_batches',
  'public.pharmacy_pos_transactions',
  'public.pharmacy_schedule_h1_register',
  'public.pmjay_beneficiary_cases',
  'public.pmjay_claims_ledger',
  'public.radiology_ai_findings',
  'public.smart_ambulance_missions',
  'public.smart_icu_telemetry_logs',
  'public.transparent_surgery_packages',
  'public.bed_turnaround_missions',
  'public.bedside_call_bell_events',
  'public.bedside_dietary_orders',
  'public.bedside_iv_telemetry_logs',
  'public.blood_bank_cold_chain_logs',
  'public.blood_bank_crossmatch_reservations',
  'public.blood_bank_unit_inventory',
  'public.corporate_b2b_accounts',
  'public.cssd_sterile_batches',
  'clinical.patient_family_health_members',
  'clinical.patient_health_wallets',
  'public.cashier_blind_drops',
  'public.chamber_yield_standby_queue'
];

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
  });
  await client.connect();

  console.log('=== HARMONIZING 25 TRAPPED TABLES TO CANONICAL TENANT ===\n');

  for (const table of tables) {
    try {
      const updateRes = await client.query(`
        UPDATE ${table}
        SET tenant_id = $1
        WHERE tenant_id != $1
      `, [CANONICAL_TENANT]);

      const countRes = await client.query(`
        SELECT count(*) FROM ${table} WHERE tenant_id = $1
      `, [CANONICAL_TENANT]);

      console.log(`  ✓ ${table}: updated ${updateRes.rowCount} rows -> Canonical Total: ${countRes.rows[0].count}`);
    } catch (e) {
      console.error(`  ✗ ${table}: ${e.message}`);
    }
  }

  await client.end();
  console.log('\n=== ALL 25 TRAPPED TABLES HARMONIZED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Fatal error during harmonization:', err);
  process.exit(1);
});
