import pg from 'pg';

const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });

const tables = [
  'clinical.patient_family_health_members',
  'clinical.patient_health_wallets',
  'clinical.abdm_consent_artifacts',
  'clinical.abdm_consent_requests',
  'public.bed_turnaround_missions',
  'public.bedside_call_bell_events',
  'public.bedside_dietary_orders',
  'public.bedside_iv_telemetry_logs',
  'public.blood_bank_cold_chain_logs',
  'public.blood_bank_crossmatch_reservations',
  'public.blood_bank_unit_inventory',
  'public.corporate_b2b_accounts',
  'public.cssd_sterile_batches',
  'public.ot_safety_checklists',
  'public.ot_sponge_needle_counts',
  'public.ot_surgical_missions',
  'public.pharmacy_pos_inventory_batches',
  'public.pharmacy_pos_transactions',
  'public.pharmacy_schedule_h1_register',
  'public.pmjay_beneficiary_cases',
  'public.pmjay_claims_ledger',
  'public.radiology_ai_findings',
  'public.smart_ambulance_missions',
  'public.smart_icu_telemetry_logs',
  'public.transparent_surgery_packages'
];

async function main() {
  await client.connect();
  console.log('=== INSPECTING 25 UNHARMONIZED TABLES ===\n');

  for (const t of tables) {
    try {
      const res = await client.query(`SELECT DISTINCT tenant_id, count(*) FROM ${t} GROUP BY tenant_id`);
      console.log(`Table: ${t}`);
      for (const r of res.rows) {
        console.log(`  Tenant: ${r.tenant_id} -> Count: ${r.count}`);
      }
    } catch (e) {
      console.log(`Table: ${t} -> Error: ${e.message}`);
    }
  }

  await client.end();
}

main().catch(console.error);
