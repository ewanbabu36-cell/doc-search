import pg from 'pg';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const LEGACY_TENANT = '6855be07-5298-4148-a571-c51ac49ac7f3';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  await client.connect();
  console.log('=== HARMONIZING REMAINING 44 TABLES TO CANONICAL TENANT ===');

  const tables = [
    'clinical.abdm_audit_traces',
    'clinical.abdm_care_context_mappings',
    'clinical.billing_price_lists',
    'clinical.corporate_tpa_clients',
    'clinical.diagnostic_health_packages',
    'clinical.doctor_payout_configurations',
    'clinical.doctor_settlement_vouchers',
    'clinical.doctor_volume_payout_tiers',
    'clinical.fhir_bundles_repository',
    'clinical.home_collection_orders',
    'clinical.insurance_authorizations',
    'clinical.insurance_claims',
    'clinical.insurance_patient_policies',
    'clinical.insurance_payers',
    'clinical.insurance_plans',
    'clinical.operational_facilities',
    'clinical.operational_organizations',
    'clinical.operational_partners',
    'clinical.patient_abha_accounts',
    'clinical.patient_care_passes',
    'clinical.patients',
    'clinical.procurement_audit_traces',
    'clinical.whatsapp_conversations',
    'clinical.whatsapp_portal_audit_traces',
    'company.partner_configuration_versions',
    'public.company_doctor_collusion_radar',
    'public.company_financial_reconciler_ledgers',
    'public.company_forensic_theft_radar',
    'public.company_honeytoken_traps',
    'public.company_nabh_audit_binders',
    'public.company_partner_dunning_pipeline',
    'public.company_phi_snoop_alerts',
    'public.company_predictive_churn_scores',
    'public.company_steganography_forensics',
    'public.company_tenant_quarantines',
    'public.company_time_travel_events',
    'public.company_tpa_clawback_sentinel',
    'public.company_tpa_statutory_rebuttals',
    'public.doctor_payout_clawbacks',
    'public.ewan_escalation_audits',
    'public.ewan_executive_briefings',
    'public.ewan_leakage_audit_logs',
    'public.ewan_nabh_statutory_binders',
    'public.nhcx_claim_transactions'
  ];

  let totalUpdated = 0;

  for (const tbl of tables) {
    const [schema, name] = tbl.split('.');
    try {
      // Find whether tenant_id or tenantId is the column name
      const colRes = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2 AND column_name IN ('tenant_id', 'tenantId');
      `, [schema, name]);

      if (colRes.rows.length > 0) {
        const col = colRes.rows[0].column_name;
        // Check how many rows match LEGACY_TENANT
        const countRes = await client.query(`
          SELECT count(*) as count FROM "${schema}"."${name}" WHERE "${col}" = $1
        `, [LEGACY_TENANT]);

        const count = parseInt(countRes.rows[0].count, 10);
        if (count > 0) {
          const updateRes = await client.query(`
            UPDATE "${schema}"."${name}" SET "${col}" = $1 WHERE "${col}" = $2
          `, [CANONICAL_TENANT, LEGACY_TENANT]);
          console.log(`✓ Updated ${updateRes.rowCount} rows in ${tbl} to canonical tenant`);
          totalUpdated += updateRes.rowCount;
        } else {
          console.log(`- 0 legacy rows in ${tbl}`);
        }
      } else {
        console.log(`! No tenant column found in ${tbl}`);
      }
    } catch (err) {
      console.warn(`✗ Error updating ${tbl}: ${err.message}`);
    }
  }

  console.log(`\n=== TOTAL ROWS HARMONIZED: ${totalUpdated} ===`);
  await client.end();
}

main().catch(console.error);
