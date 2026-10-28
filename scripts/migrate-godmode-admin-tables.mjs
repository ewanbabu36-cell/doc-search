import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT = '6855be07-5298-4148-a571-c51ac49ac7f3';

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('[*] Connected to PostgreSQL 18.4. Executing God-Level Admin & Founder Command Tables Migration...');

  // 1. God-Mode Impersonation Sessions
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_god_impersonation_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id VARCHAR(100) NOT NULL,
      admin_name VARCHAR(255) NOT NULL DEFAULT 'Founder Meraj',
      admin_email VARCHAR(255) NOT NULL DEFAULT 'founder@docsearch.internal',
      target_tenant_id VARCHAR(100) NOT NULL,
      target_tenant_name VARCHAR(255) NOT NULL,
      target_user_id VARCHAR(100) NOT NULL,
      target_user_name VARCHAR(255) NOT NULL,
      target_user_role VARCHAR(100) NOT NULL,
      session_token TEXT NOT NULL UNIQUE,
      reason TEXT NOT NULL,
      ip_address VARCHAR(100) NOT NULL DEFAULT '127.0.0.1',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      session_mode VARCHAR(50) NOT NULL DEFAULT 'READ_ONLY_AUDITED',
      started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ended_at TIMESTAMP WITH TIME ZONE,
      audit_hash VARCHAR(128) NOT NULL,
      actions_log JSONB NOT NULL DEFAULT '[]'::jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_godmode_sessions ON company_god_impersonation_sessions (target_tenant_id, is_active);
  `);
  console.log('  ✔ Table: company_god_impersonation_sessions ready');

  // 2. Dynamic Feature Flags & Circuit Breakers
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_dynamic_feature_flags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      flag_key VARCHAR(100) NOT NULL UNIQUE,
      feature_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'CLINICAL_AI',
      description TEXT NOT NULL,
      is_globally_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      target_tenants JSONB NOT NULL DEFAULT '["*"]'::jsonb,
      target_roles JSONB NOT NULL DEFAULT '["*"]'::jsonb,
      rollout_pct INT NOT NULL DEFAULT 100,
      circuit_breaker_active BOOLEAN NOT NULL DEFAULT FALSE,
      fallback_action VARCHAR(100) DEFAULT 'INTERNAL_GRACEFUL_DEGRADATION',
      updated_by VARCHAR(255) NOT NULL DEFAULT 'Founder Meraj',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_feature_flags ON company_dynamic_feature_flags (flag_key, is_globally_enabled);
  `);
  console.log('  ✔ Table: company_dynamic_feature_flags ready');

  // 3. Forensic Revenue Theft Radar
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_forensic_theft_radar (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      tenant_name VARCHAR(255) NOT NULL,
      staff_id VARCHAR(100) NOT NULL,
      staff_name VARCHAR(255) NOT NULL,
      staff_role VARCHAR(100) NOT NULL,
      anomaly_type VARCHAR(100) NOT NULL,
      detected_cash_leakage NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      confidence_score INT NOT NULL DEFAULT 92,
      severity VARCHAR(50) NOT NULL DEFAULT 'CRITICAL',
      details TEXT NOT NULL,
      auto_action_taken VARCHAR(100) NOT NULL DEFAULT 'SUPERVISOR_OVERRIDE_MANDATED',
      is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
      detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_forensic_theft ON company_forensic_theft_radar (tenant_id, severity, is_quarantined);
  `);
  console.log('  ✔ Table: company_forensic_theft_radar ready');

  // 4. Predictive Churn Radar
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_predictive_churn_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL UNIQUE,
      hospital_name VARCHAR(255) NOT NULL,
      partner_tier VARCHAR(100) NOT NULL DEFAULT 'ENTERPRISE_HOSPITAL',
      mrr_amount NUMERIC(12, 2) NOT NULL DEFAULT 24999.00,
      dau_trend_pct NUMERIC(5, 2) NOT NULL DEFAULT -18.50,
      token_velocity_change_pct NUMERIC(5, 2) NOT NULL DEFAULT -22.40,
      churn_risk_grade VARCHAR(50) NOT NULL DEFAULT 'AMBER_WATCH',
      churn_probability_pct NUMERIC(5, 2) NOT NULL DEFAULT 74.50,
      automated_intervention VARCHAR(100) NOT NULL DEFAULT 'AUTO_DISPATCH_RETENTION_COUPON_WHATSAPP',
      intervention_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_OUTREACH',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_churn_scores ON company_predictive_churn_scores (churn_risk_grade);
  `);
  console.log('  ✔ Table: company_predictive_churn_scores ready');

  // 5. Central Supply Arbitrage
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_central_supply_arbitrage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_code VARCHAR(100) NOT NULL UNIQUE,
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'SURGICAL_CONSUMABLE',
      manufacturer_name VARCHAR(255) NOT NULL,
      mfg_bulk_cost NUMERIC(10, 2) NOT NULL,
      platform_resale_price NUMERIC(10, 2) NOT NULL,
      hospital_mrp NUMERIC(10, 2) NOT NULL,
      gross_margin_pct NUMERIC(5, 2) NOT NULL,
      monthly_pan_india_consumption_units INT NOT NULL DEFAULT 12500,
      projected_monthly_arbitrage_profit NUMERIC(12, 2) NOT NULL,
      in_stock_depot VARCHAR(100) NOT NULL DEFAULT 'CENTRAL_NCR_DEPOT_01',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_supply_arbitrage ON company_central_supply_arbitrage (category);
  `);
  console.log('  ✔ Table: company_central_supply_arbitrage ready');

  // 6. Tenant Emergency Quarantine
  await client.query(`
    CREATE TABLE IF NOT EXISTS company_tenant_quarantines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL UNIQUE,
      tenant_name VARCHAR(255) NOT NULL,
      quarantine_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_OPERATIONAL',
      quarantine_reason TEXT,
      tokens_revoked_count INT NOT NULL DEFAULT 0,
      read_only_enforced BOOLEAN NOT NULL DEFAULT FALSE,
      backup_snapshot_hash VARCHAR(128),
      initiated_by VARCHAR(255) NOT NULL DEFAULT 'Founder Meraj',
      initiated_at TIMESTAMP WITH TIME ZONE
    );
    CREATE INDEX IF NOT EXISTS idx_tenant_quarantines ON company_tenant_quarantines (quarantine_status);
  `);
  console.log('  ✔ Table: company_tenant_quarantines ready');

  // SEED INITIAL BATTLE-TESTED BASELINE RECORDS

  // Seed Dynamic Feature Flags
  await client.query(`
    INSERT INTO company_dynamic_feature_flags (
      flag_key, feature_name, category, description,
      is_globally_enabled, rollout_pct, circuit_breaker_active, fallback_action
    ) VALUES 
    ('AI_CLINICAL_SCRIBE_MULTILINGUAL', 'Ambient Multilingual AI Scribe', 'AI_ENGINE', 'Zero-click doctor speech-to-EMR transcription in Hindi/Hinglish/English', true, 100, false, 'MANUAL_EMR_TYPING'),
    ('NHCX_1_HOUR_CASHLESS_DISCHARGE', 'IRDAI 1-Hour Cashless Fast-Track', 'HEALTH_INSURANCE', 'FHIR R4 automated pre-auth settlement guarantee under 60 minutes', true, 100, false, 'OFFLINE_TPA_SUBMISSION'),
    ('NHA_ABDM_M1_M3_SYNC', 'ABDM Milestone 1-3 National Cloud Sync', 'GOVERNMENT_STACK', 'ABHA creation, Scan & Share, and HIP/HIU health data consent records', true, 100, false, 'LOCAL_STORAGE_QUEUE'),
    ('FEFO_SCHEDULE_H1_NARCOTICS_LOCK', 'FEFO Expiry Lock & Schedule H1 POS', 'PHARMACY_SAFETY', 'Hard-blocks dispensing batches <45 days and mandates doctor Reg No', true, 100, false, 'PHARMACIST_OVERRIDE_PIN'),
    ('IOT_COLD_CHAIN_TEMPERATURE_ALARM', 'Blood Bank 2°C-6°C IoT Stream', 'TRANSFUSION_SAFETY', 'Real-time telemetry alerting when refrigeration drifts outside safe limits', true, 100, false, 'SMS_TECHNICIAN_DISPATCH'),
    ('CIRCUIT_BREAKER_SMS_GATEWAY', 'Emergency SMS Gateway Circuit Breaker', 'COMMUNICATION_BRIDGE', 'Emergency circuit breaker with automated zero-downtime WhatsApp OTP bridge fallback', true, 100, false, 'AUTOMATED_WHATSAPP_FALLBACK')
    ON CONFLICT (flag_key) DO UPDATE SET
      is_globally_enabled = EXCLUDED.is_globally_enabled,
      rollout_pct = EXCLUDED.rollout_pct;
  `);

  // Seed Forensic Theft Radar Baseline
  await client.query(`
    INSERT INTO company_forensic_theft_radar (
      tenant_id, tenant_name, staff_id, staff_name, staff_role,
      anomaly_type, detected_cash_leakage, confidence_score, severity,
      details, auto_action_taken
    ) VALUES (
      $1, 'Apollo City Multi-Specialty Hospital', 'STAFF-REC-019', 'Kavita Deshmukh', 'FRONT_DESK_RECEPTIONIST',
      'ABNORMAL_CASH_CANCELLATIONS', 14200.00, 96, 'CRITICAL',
      'Pattern identified: 8 consecutive OPD consultation slips marked "Patient Left Without Consult - Cash Refunded" within 45 minutes; camera logs indicate consult took place.',
      'CASH_REFUND_PERMISSION_REVOKED'
    ) ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  // Seed Predictive Churn Radar
  await client.query(`
    INSERT INTO company_predictive_churn_scores (
      tenant_id, hospital_name, partner_tier, mrr_amount,
      dau_trend_pct, token_velocity_change_pct, churn_risk_grade,
      churn_probability_pct, automated_intervention
    ) VALUES 
    ($1, 'Apollo City Multi-Specialty Hospital', 'ENTERPRISE_HOSPITAL', 45000.00, -18.50, -22.40, 'AMBER_WATCH', 68.50, 'AUTO_DISPATCH_RETENTION_COUPON_WHATSAPP'),
    ('TENANT-NCR-MAXCARE', 'MaxCare Superspecialty Hospital (Gurgaon)', 'DIAGNOSTIC_NETWORK', 89000.00, 4.20, 11.50, 'GREEN_HEALTHY', 12.00, 'NONE_GROWTH_TRACK'),
    ('TENANT-PUNE-METRO', 'Metro Life Care Clinic & Dialysis', 'CLINIC_NETWORK', 18000.00, -42.00, -58.00, 'RED_CRITICAL', 88.00, 'DISPATCH_KEY_ACCOUNT_DIRECTOR')
    ON CONFLICT (tenant_id) DO UPDATE SET
      churn_probability_pct = EXCLUDED.churn_probability_pct;
  `, [ACTIVE_TENANT]);

  // Seed Central Supply Arbitrage
  await client.query(`
    INSERT INTO company_central_supply_arbitrage (
      item_code, item_name, category, manufacturer_name,
      mfg_bulk_cost, platform_resale_price, hospital_mrp,
      gross_margin_pct, monthly_pan_india_consumption_units,
      projected_monthly_arbitrage_profit, in_stock_depot
    ) VALUES 
    ('SUP-SYR-001', 'BD Discardit II 5ml Sterile Syringes (Box of 100)', 'SURGICAL_CONSUMABLE', 'Becton Dickinson India', 210.00, 360.00, 550.00, 41.67, 18500, 2775000.00, 'CENTRAL_NCR_DEPOT_01'),
    ('SUP-GLV-002', 'Nitrile Powder-Free Exam Gloves M (Box of 100)', 'PPE_CONSUMABLE', 'Sempermed / Ansell', 180.00, 290.00, 480.00, 37.93, 24000, 2640000.00, 'CENTRAL_MUMBAI_DEPOT_02'),
    ('SUP-CT-003', 'Iohexol 350mg/ml 100ml CT Contrast Chemical', 'RADIOLOGY_REAGENT', 'GE Healthcare / Sun Pharma', 750.00, 1250.00, 2100.00, 40.00, 4200, 2100000.00, 'CENTRAL_NCR_DEPOT_01'),
    ('SUP-VAC-004', 'K2 EDTA Purple Top Blood Vacutainer Tubes (100pk)', 'PATHOLOGY_REAGENT', 'Greiner Bio-One', 420.00, 680.00, 1100.00, 38.24, 15000, 3900000.00, 'CENTRAL_BLR_DEPOT_03')
    ON CONFLICT (item_code) DO UPDATE SET
      gross_margin_pct = EXCLUDED.gross_margin_pct;
  `);

  // Seed Tenant Quarantine Baseline
  await client.query(`
    INSERT INTO company_tenant_quarantines (
      tenant_id, tenant_name, quarantine_status, tokens_revoked_count, read_only_enforced
    ) VALUES (
      $1, 'Apollo City Multi-Specialty Hospital', 'ACTIVE_OPERATIONAL', 0, false
    ) ON CONFLICT (tenant_id) DO NOTHING;
  `, [ACTIVE_TENANT]);

  console.log('  ✔ Seeded baseline God-Level Admin operational data successfully.');
  await client.end();
  console.log('[✔] God-Level Admin Tables Migration Completed!');
}

migrate().catch((err) => {
  console.error('[!] Migration failed:', err);
  process.exit(1);
});
