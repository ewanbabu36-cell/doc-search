/**
 * MIGRATION & SEEDING SCRIPT: GOD-MODE OMNIPOTENT FOUNDER CONTROL MATRIX
 * PostgreSQL 18.4 Native Schema Hardening
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT = '6855be07-5298-4148-a571-c51ac49ac7f3';

async function migrateOmnipotent() {
  console.log('[*] Connected to PostgreSQL 18.4. Executing God-Mode Omnipotent Matrix Schema Hardening...');
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  // 1. VIP PHI Snooping Alerts Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_phi_snoop_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      tenant_name VARCHAR(255) NOT NULL,
      actor_id VARCHAR(100) NOT NULL,
      actor_name VARCHAR(255) NOT NULL,
      actor_role VARCHAR(100) NOT NULL,
      patient_id VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      patient_vip_level VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
      read_anomaly_score INT NOT NULL DEFAULT 85,
      clinical_justification_present BOOLEAN NOT NULL DEFAULT FALSE,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      audit_hash VARCHAR(128) NOT NULL,
      detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_phi_snoop ON company_phi_snoop_alerts (tenant_id, is_locked);
  `);
  console.log('  ✔ Table: company_phi_snoop_alerts ready');

  // 2. Time-Travel Entity Snapshots
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_time_travel_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100) NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      snapshot_before JSONB,
      snapshot_after JSONB,
      mutated_by VARCHAR(255) NOT NULL,
      mutated_from_ip VARCHAR(50) NOT NULL,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_time_travel ON company_time_travel_events (tenant_id, recorded_at DESC);
  `);
  console.log('  ✔ Table: company_time_travel_events ready');

  // 3. Doctor-Pharma Collusion & Phantom Billing Radar
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_doctor_collusion_radar (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      doctor_id VARCHAR(100) NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      department VARCHAR(100) NOT NULL,
      external_lab_referral_pct NUMERIC(5, 2) NOT NULL DEFAULT 42.50,
      high_cost_molecule_bias_pct NUMERIC(5, 2) NOT NULL DEFAULT 78.20,
      kickback_risk_score INT NOT NULL DEFAULT 88,
      anomaly_pattern VARCHAR(255) NOT NULL,
      quantified_monthly_leakage NUMERIC(12, 2) NOT NULL DEFAULT 145000.00,
      prescription_restricted BOOLEAN NOT NULL DEFAULT FALSE,
      mandate_generic_substitution BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_doctor_collusion ON company_doctor_collusion_radar (kickback_risk_score DESC);
  `);
  console.log('  ✔ Table: company_doctor_collusion_radar ready');

  // 4. Partner Dunning Friction & Recovery Pipeline
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_partner_dunning_pipeline (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL UNIQUE,
      hospital_name VARCHAR(255) NOT NULL,
      partner_tier VARCHAR(100) NOT NULL,
      monthly_subscription_mrr NUMERIC(10, 2) NOT NULL,
      outstanding_balance NUMERIC(10, 2) NOT NULL,
      overdue_days INT NOT NULL DEFAULT 14,
      friction_tier VARCHAR(50) NOT NULL DEFAULT 'TIER_1_BANNER',
      artificial_latency_ms INT NOT NULL DEFAULT 0,
      ai_scribe_daily_token_quota INT NOT NULL DEFAULT 100,
      emi_settlement_offered BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_dunning_tier ON company_partner_dunning_pipeline (friction_tier);
  `);
  console.log('  ✔ Table: company_partner_dunning_pipeline ready');

  // 5. Zero-Trust Dual-Key Nuclear Launch Vault
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_vault_authorizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_code VARCHAR(100) NOT NULL UNIQUE,
      action_type VARCHAR(100) NOT NULL,
      target_tenant_id VARCHAR(100),
      requested_by VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_CONSENSUS',
      founder_master_key_used BOOLEAN NOT NULL DEFAULT FALSE,
      totp_verified BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE
    );
    CREATE INDEX IF NOT EXISTS idx_vault_auth ON company_vault_authorizations (challenge_code, status);
  `);
  console.log('  ✔ Table: company_vault_authorizations ready');

  // 6. NABH 5th Edition Statutory Audit Binders
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_nabh_audit_binders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      tenant_name VARCHAR(255) NOT NULL,
      binder_edition VARCHAR(50) NOT NULL DEFAULT 'NABH_5TH_EDITION',
      autoclave_spore_test_status VARCHAR(50) NOT NULL DEFAULT 'PASS_ZERO_GROWTH',
      needle_stick_incidents_count INT NOT NULL DEFAULT 0,
      biomedical_waste_barcoded_kg NUMERIC(10, 2) NOT NULL DEFAULT 184.50,
      biomedical_calibration_compliance_pct NUMERIC(5, 2) NOT NULL DEFAULT 98.40,
      cryptographic_seal_hash VARCHAR(128) NOT NULL,
      compiled_by VARCHAR(255) NOT NULL,
      compiled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_nabh_binders ON company_nabh_audit_binders (tenant_id);
  `);
  console.log('  ✔ Table: company_nabh_audit_binders ready');

  // SEED BATTLE-TESTED BASELINE RECORDS FOR EACH ENCLAVE

  // 1. Seed VIP PHI Snoop Alerts
  await client.query(`
    INSERT INTO company_phi_snoop_alerts (
      tenant_id, tenant_name, actor_id, actor_name, actor_role,
      patient_id, patient_name, patient_vip_level, read_anomaly_score,
      clinical_justification_present, is_locked, audit_hash
    ) VALUES 
    (
      $1, 'Apollo City Multi-Specialty Hospital', 'STAFF-REC-082', 'Sunita R. Jadhav', 'RECEPTIONIST_FRONT_DESK',
      'PAT-VIP-9901', 'Hon. Justice Rajeshwar Rao (High Court)', 'VIP_JUDICIARY', 96,
      false, false, 'a9f24c08e5e89278912ef09341ba89d02341908b1a89c89e21fbc812981048b1'
    ),
    (
      $1, 'Apollo City Multi-Specialty Hospital', 'STAFF-NSG-014', 'Kiran M. Nair', 'FLOOR_STAFF_NURSE',
      'PAT-VIP-4412', 'Aarav Singhania (Industrialist Heir)', 'VIP_HIGH_NET_WORTH', 92,
      false, false, '7c89f1092efb1092834bca0912e8712398401928301928410293801293810293'
    )
    ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  // 2. Seed Time Travel Historical Snapshots
  await client.query(`
    INSERT INTO company_time_travel_events (
      tenant_id, entity_type, entity_id, action_type,
      snapshot_before, snapshot_after, mutated_by, mutated_from_ip, recorded_at
    ) VALUES 
    (
      $1, 'PATIENT_BILLING_INVOICE', 'INV-2026-9041', 'MUTATED',
      '{"invoiceId": "INV-2026-9041", "patientName": "Sunil Mehta", "grossAmount": 85000, "discountApplied": 0, "status": "PENDING_CASH"}'::jsonb,
      '{"invoiceId": "INV-2026-9041", "patientName": "Sunil Mehta", "grossAmount": 45000, "discountApplied": 40000, "status": "VOID_REVISION"}'::jsonb,
      'Cashier Ramesh K.', '192.168.1.104', NOW() - INTERVAL '2 hours'
    ),
    (
      $1, 'SURGICAL_IMPLANT_LEDGER', 'IMP-KNEE-009', 'DELETED',
      '{"implantCode": "STRYKER-KNEE-T2", "batchNo": "B-99120", "vaultId": "OT_VAULT_1", "status": "CHECKED_OUT"}'::jsonb,
      '{"implantCode": "STRYKER-KNEE-T2", "status": "DELETED_LOST_IN_TRANSIT"}'::jsonb,
      'OT Store Incharge Suresh', '192.168.1.118', NOW() - INTERVAL '5 hours'
    )
    ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  // 3. Seed Collusion Radar
  await client.query(`
    INSERT INTO company_doctor_collusion_radar (
      tenant_id, doctor_id, doctor_name, department,
      external_lab_referral_pct, high_cost_molecule_bias_pct, kickback_risk_score,
      anomaly_pattern, quantified_monthly_leakage, prescription_restricted, mandate_generic_substitution
    ) VALUES 
    (
      $1, 'DOC-ORTHO-007', 'Dr. Arvind Swaminathan', 'ORTHOPEDICS',
      84.50, 91.20, 94,
      'Directs 85% of MRI scans to Apex Diagnostic Centre (outside hospital); 92% of painkiller prescriptions specify brand Zerodol-SP over generic Aceclofenac+Paracetamol.',
      210000.00, false, false
    ),
    (
      $1, 'DOC-CARD-003', 'Dr. Farooq Qureshi', 'CARDIOLOGY',
      32.00, 88.50, 78,
      'Exclusive prescribing of branded Rosuvastatin 40mg combo with zero generic substitution permitted on EMR print.',
      128000.00, false, false
    )
    ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  // 4. Seed Partner Dunning Pipeline
  await client.query(`
    INSERT INTO company_partner_dunning_pipeline (
      tenant_id, hospital_name, partner_tier, monthly_subscription_mrr,
      outstanding_balance, overdue_days, friction_tier, artificial_latency_ms,
      ai_scribe_daily_token_quota, emi_settlement_offered
    ) VALUES 
    (
      'TENANT-PUNE-METRO', 'Metro Life Care Clinic & Dialysis', 'CLINIC_NETWORK',
      18000.00, 54000.00, 42, 'TIER_3_AI_THROTTLE', 1500, 20, true
    ),
    (
      $1, 'Apollo City Multi-Specialty Hospital', 'ENTERPRISE_HOSPITAL',
      45000.00, 0.00, 0, 'TIER_1_BANNER', 0, 1000, false
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      outstanding_balance = EXCLUDED.outstanding_balance;
  `, [ACTIVE_TENANT]);

  // 5. Seed NABH Statutory Binder Baseline
  await client.query(`
    INSERT INTO company_nabh_audit_binders (
      tenant_id, tenant_name, binder_edition, autoclave_spore_test_status,
      needle_stick_incidents_count, biomedical_waste_barcoded_kg,
      biomedical_calibration_compliance_pct, cryptographic_seal_hash, compiled_by
    ) VALUES 
    (
      $1, 'Apollo City Multi-Specialty Hospital', 'NABH_5TH_EDITION',
      'PASS_ZERO_GROWTH_BI_VIAL_OK', 0, 245.80, 99.20,
      '9a8e23f0192830192834bca0912e871239840192830192841029380129381029',
      'Chief Clinical Auditor (Autonomous Ewan Brain)'
    )
    ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  console.log('[✔] God-Mode Omnipotent Matrix Schema Hardening & Master Seeding Completed!');
  await client.end();
}

migrateOmnipotent().catch((err) => {
  console.error('[!] Migration failed:', err);
  process.exit(1);
});
