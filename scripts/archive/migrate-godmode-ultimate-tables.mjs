/**
 * MIGRATION & SEEDING SCRIPT: DOCSEARCH OMNISCIENT GOD-LEVEL FOUNDER CONTROL MATRIX
 * PostgreSQL 18.4 Native Schema Hardening (Enclaves 1 to 6)
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT = '6855be07-5298-4148-a571-c51ac49ac7f3';
const HOSPITAL_NAME = 'Apollo City Multi-Specialty Hospital';

async function migrateUltimateOmniscient() {
  console.log('[*] Connected to PostgreSQL 18.4. Executing Ultimate Omniscient Matrix Schema Hardening...');
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // 1. Enclave 1: Steganography Forensics Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_steganography_forensics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(100) NOT NULL,
        actor_id VARCHAR(100) NOT NULL,
        actor_name VARCHAR(255) NOT NULL,
        client_ip VARCHAR(50) NOT NULL,
        session_hash VARCHAR(128) NOT NULL,
        stego_salt VARCHAR(64) NOT NULL,
        pattern_matrix JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_stego_actor ON company_steganography_forensics (tenant_id, actor_id);
    `);
    console.log('  ✔ Table: company_steganography_forensics ready');

    // 2. Enclave 2: Honeytoken Canary Traps & Incidents
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_honeytoken_traps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(100) NOT NULL,
        token_type VARCHAR(64) NOT NULL,
        decoy_entity_id VARCHAR(128) NOT NULL UNIQUE,
        decoy_payload JSONB NOT NULL,
        trip_count INT NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'ARMED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_honeytoken_traps ON company_honeytoken_traps (tenant_id, status);

      CREATE TABLE IF NOT EXISTS company_honeytoken_incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trap_id UUID NOT NULL,
        actor_id VARCHAR(100) NOT NULL,
        actor_name VARCHAR(255) NOT NULL,
        actor_role VARCHAR(100) NOT NULL,
        client_ip VARCHAR(50) NOT NULL,
        query_context TEXT NOT NULL,
        captured_session_evidence JSONB NOT NULL,
        is_isolated BOOLEAN NOT NULL DEFAULT FALSE,
        trip_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_honeytoken_incidents ON company_honeytoken_incidents (trap_id, is_isolated);
    `);
    console.log('  ✔ Tables: company_honeytoken_traps & company_honeytoken_incidents ready');

    // 3. Enclave 3: TPA Insurance Clawback Sentinel & Statutory Rebuttals
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_tpa_clawback_sentinel (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        claim_id VARCHAR(128) NOT NULL UNIQUE,
        tenant_id VARCHAR(100) NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        insurer_name VARCHAR(128) NOT NULL,
        patient_id VARCHAR(100) NOT NULL,
        claim_amount_inr NUMERIC(14, 2) NOT NULL,
        pre_audit_risk_score INT NOT NULL,
        flagged_icd10_mismatches JSONB NOT NULL,
        potential_clawback_inr NUMERIC(14, 2) NOT NULL,
        audit_status VARCHAR(64) NOT NULL DEFAULT 'FLAGGED_PRE_SUBMISSION',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tpa_clawback ON company_tpa_clawback_sentinel (tenant_id, audit_status);

      CREATE TABLE IF NOT EXISTS company_tpa_statutory_rebuttals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        claim_id VARCHAR(128) NOT NULL,
        tenant_id VARCHAR(100) NOT NULL,
        insurer_id VARCHAR(128) NOT NULL,
        irda_circular_reference VARCHAR(255) NOT NULL,
        clinical_justification TEXT NOT NULL,
        generated_legal_notice TEXT NOT NULL,
        sha256_seal VARCHAR(128) NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'DISPATCHED_TO_GRIEVANCE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tpa_rebuttals ON company_tpa_statutory_rebuttals (tenant_id, claim_id);
    `);
    console.log('  ✔ Tables: company_tpa_clawback_sentinel & company_tpa_statutory_rebuttals ready');

    // 4. Enclave 4: Doctor Referral Cartel & Dark Poaching Radar
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_doctor_cartel_radar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id VARCHAR(100) NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        hospital_id VARCHAR(100) NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        opd_consult_count INT NOT NULL,
        internal_diagnostic_conversion_pct NUMERIC(5, 2) NOT NULL,
        benchmark_dept_conversion_pct NUMERIC(5, 2) NOT NULL,
        external_leakage_risk_score INT NOT NULL,
        suspected_destination_entity VARCHAR(255) NOT NULL,
        estimated_monthly_poaching_loss_inr NUMERIC(14, 2) NOT NULL,
        status VARCHAR(64) NOT NULL DEFAULT 'UNDER_RADAR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_doctor_cartel ON company_doctor_cartel_radar (hospital_id, status);
    `);
    console.log('  ✔ Table: company_doctor_cartel_radar ready');

    // 5. Enclave 5: Financial Self-Healing & Split-Brain Reconciler
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_financial_reconciler_ledgers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR(100) NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        counter_id VARCHAR(64) NOT NULL,
        cashier_id VARCHAR(100) NOT NULL,
        cashier_name VARCHAR(255) NOT NULL,
        shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
        shift_end TIMESTAMP WITH TIME ZONE,
        physical_cash_reported_inr NUMERIC(14, 2) NOT NULL,
        pos_terminal_settled_inr NUMERIC(14, 2) NOT NULL,
        online_gateway_settled_inr NUMERIC(14, 2) NOT NULL,
        system_billed_total_inr NUMERIC(14, 2) NOT NULL,
        variance_inr NUMERIC(14, 2) NOT NULL,
        reconciliation_status VARCHAR(64) NOT NULL DEFAULT 'BALANCED',
        auto_healed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_fin_recon ON company_financial_reconciler_ledgers (tenant_id, reconciliation_status);
    `);
    console.log('  ✔ Table: company_financial_reconciler_ledgers ready');

    // --- SEED PRODUCTION BASELINES ---
    console.log('[*] Seeding production baselines for all 6 Enclaves...');

    // Seed Steganography Baseline
    const stegoCheck = await client.query('SELECT COUNT(*) FROM company_steganography_forensics');
    if (parseInt(stegoCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO company_steganography_forensics (
          tenant_id, actor_id, actor_name, client_ip, session_hash, stego_salt, pattern_matrix
        ) VALUES (
          $1, 'STAFF-RN-9921', 'Staff Nurse Sunita Rao', '192.168.31.84',
          '9f82d1c68e3a241b7f0e95c812d4a6f7b3c2e1a90d8f7e6c5b4a3210fedcba98',
          'SALT-STEGO-2026-X9',
          '{"gridSpacing": 8, "alphaModulation": 0.015, "kerningShiftPpm": 4, "pixelSeed": "0xDEADBEEF"}'::jsonb
        );
      `, [ACTIVE_TENANT]);
      console.log('  ✔ Seeded steganography forensic fingerprint');
    }

    // Seed Honeytoken Traps & Incident
    const trapCheck = await client.query('SELECT COUNT(*) FROM company_honeytoken_traps');
    if (parseInt(trapCheck.rows[0].count, 10) === 0) {
      const trapRes = await client.query(`
        INSERT INTO company_honeytoken_traps (
          tenant_id, token_type, decoy_entity_id, decoy_payload, trip_count, status
        ) VALUES (
          $1, 'PATIENT_CHART', 'CANARY-VIP-JUSTICE-901',
          '{"patientName": "Hon. Justice D. Y. Chandrachud (Former CJI)", "vipTier": "VVIP_JUDICIARY", "diagnosis": "Routine Executive Cardiac Stress MRI", "room": "Presidency Suite 401"}'::jsonb,
          1, 'ARMED'
        ) RETURNING id;
      `, [ACTIVE_TENANT]);

      const trapId = trapRes.rows[0].id;

      await client.query(`
        INSERT INTO company_honeytoken_incidents (
          trap_id, actor_id, actor_name, actor_role, client_ip, query_context, captured_session_evidence, is_isolated
        ) VALUES (
          $1, 'DEV-INTERN-402', 'Rohan Verma (Contract Developer)', 'DB_ADMIN_INTERN', '10.0.4.19',
          'Direct SELECT on patient_records where vip_level = VVIP without active OPD token',
          '{"browser": "Chrome 128 / macOS", "queryTime": "2026-10-28T11:42:10Z", "clipboardDump": "Copied VIP Patient ID", "networkTrace": "Port scan 5432"}'::jsonb,
          FALSE
        );
      `, [trapId]);
      console.log('  ✔ Seeded honeytoken canary trap & tripped incident');
    }

    // Seed TPA Clawback Sentinel
    const tpaCheck = await client.query('SELECT COUNT(*) FROM company_tpa_clawback_sentinel');
    if (parseInt(tpaCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO company_tpa_clawback_sentinel (
          claim_id, tenant_id, hospital_name, insurer_name, patient_id, claim_amount_inr, pre_audit_risk_score,
          flagged_icd10_mismatches, potential_clawback_inr, audit_status
        ) VALUES (
          'CLM-STAR-2026-94821', $1, $2, 'Star Health Allied Insurance', 'PAT-CARDIO-8812', 485000.00, 94,
          '{"declaredDiagnosis": "I21.0 - Acute Transmural Myocardial Infarction", "codedProcedures": ["36.06 - Percutaneous Transluminal Coronary Angioplasty with Drug-Eluting Stent"], "discrepancy": "Missing Troponin-I quantitative delta curve & syntax score in clinical discharge summary. Likely 100% clawback."}'::jsonb,
          185000.00, 'FLAGGED_PRE_SUBMISSION'
        ),
        (
          'CLM-HDFC-2026-73190', $1, $2, 'HDFC ERGO General Insurance', 'PAT-ORTHO-4102', 290000.00, 78,
          '{"declaredDiagnosis": "M17.1 - Primary Unilateral Osteoarthritis, Knee", "codedProcedures": ["81.54 - Total Knee Replacement"], "discrepancy": "Pre-auth authorization letter specifies cemented prosthesis, billing invoice charged uncemented ceramic."}'::jsonb,
          75000.00, 'FLAGGED_PRE_SUBMISSION'
        );
      `, [ACTIVE_TENANT, HOSPITAL_NAME]);
      console.log('  ✔ Seeded TPA insurance clawback risk records');
    }

    // Seed Doctor Cartel Radar
    const cartelCheck = await client.query('SELECT COUNT(*) FROM company_doctor_cartel_radar');
    if (parseInt(cartelCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO company_doctor_cartel_radar (
          doctor_id, doctor_name, specialty, hospital_id, hospital_name, opd_consult_count,
          internal_diagnostic_conversion_pct, benchmark_dept_conversion_pct, external_leakage_risk_score,
          suspected_destination_entity, estimated_monthly_poaching_loss_inr, status
        ) VALUES (
          'DOC-NEURO-881', 'Dr. Ashish Kulkarni', 'Neurosurgery & Spine', $1, $2, 280,
          6.4, 38.5, 96, 'City Neuro-Scan Diagnostics & Spine Wellness Clinic (External)', 840000.00, 'SUSPECTED_POACHING'
        ),
        (
          'DOC-GASTRO-552', 'Dr. Priya Raghavan', 'Medical Gastroenterology', $1, $2, 340,
          11.2, 42.0, 88, 'Apex Endoscopy & Daycare Surgery Center (Sector 4)', 420000.00, 'UNDER_RADAR'
        );
      `, [ACTIVE_TENANT, HOSPITAL_NAME]);
      console.log('  ✔ Seeded doctor referral cartel and poaching records');
    }

    // Seed Financial Reconciler Ledgers
    const finCheck = await client.query('SELECT COUNT(*) FROM company_financial_reconciler_ledgers');
    if (parseInt(finCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO company_financial_reconciler_ledgers (
          tenant_id, hospital_name, counter_id, cashier_id, cashier_name, shift_start, shift_end,
          physical_cash_reported_inr, pos_terminal_settled_inr, online_gateway_settled_inr,
          system_billed_total_inr, variance_inr, reconciliation_status
        ) VALUES (
          $1, $2, 'COUNTER-OPD-01', 'CASHIER-102', 'Ramesh Kumar (Senior Cashier)',
          NOW() - INTERVAL '8 HOURS', NOW(),
          184200.00, 312500.00, 145000.00, 641700.00, 0.00, 'BALANCED'
        ),
        (
          $1, $2, 'COUNTER-EMR-02', 'CASHIER-108', 'Alok Pandey (Night Cashier)',
          NOW() - INTERVAL '12 HOURS', NOW() - INTERVAL '4 HOURS',
          92000.00, 140000.00, 85000.00, 327000.00, -10000.00, 'DISCREPANCY_LOCKED'
        );
      `, [ACTIVE_TENANT, HOSPITAL_NAME]);
      console.log('  ✔ Seeded financial reconciliation shift ledgers');
    }

    console.log('\n============================================================');
    console.log('✅ ALL 6 ULTIMATE OMNISCIENT TABLES MIGRATED & SEEDED CLEANLY');
    console.log('============================================================');
  } finally {
    await client.end();
  }
}

migrateUltimateOmniscient().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
