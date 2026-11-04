import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT = '6855be07-5298-4148-a571-c51ac49ac7f3';

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('[*] Connected to PostgreSQL 18.4. Executing EWAN 2.0 Super-Brain Tables Migration...');

  // 1. EWAN Leakage Audit Logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS ewan_leakage_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      total_leakage_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      unbilled_consumables_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      doctor_clawback_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      cashier_variance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      dead_stock_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_DETECTED',
      leakage_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      auto_healed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      auto_healed_at TIMESTAMP WITH TIME ZONE,
      auto_healed_by VARCHAR(255),
      resolution_log JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ewan_leakage_tenant ON ewan_leakage_audit_logs (tenant_id, status);
  `);
  console.log('  ✔ Table: ewan_leakage_audit_logs ready');

  // 2. Cashier Blind Drops
  await client.query(`
    CREATE TABLE IF NOT EXISTS cashier_blind_drops (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      shift_id VARCHAR(100) NOT NULL,
      cashier_name VARCHAR(255) NOT NULL,
      pos_terminal_id VARCHAR(50) NOT NULL,
      system_expected_cash NUMERIC(12, 2) NOT NULL,
      physical_drop_cash NUMERIC(12, 2) NOT NULL,
      variance_amount NUMERIC(12, 2) NOT NULL,
      variance_status VARCHAR(50) NOT NULL DEFAULT 'UNRESOLVED_DISCREPANCY',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cashier_blind_drops ON cashier_blind_drops (tenant_id, variance_status);
  `);
  console.log('  ✔ Table: cashier_blind_drops ready');

  // 3. Doctor Payout Clawbacks
  await client.query(`
    CREATE TABLE IF NOT EXISTS doctor_payout_clawbacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      doctor_id VARCHAR(100) NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      invoice_number VARCHAR(100) NOT NULL,
      refund_reason VARCHAR(255) NOT NULL,
      clawback_amount NUMERIC(12, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_DEBIT_NOTE',
      debit_note_reference VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_doc_clawbacks ON doctor_payout_clawbacks (tenant_id, status);
  `);
  console.log('  ✔ Table: doctor_payout_clawbacks ready');

  // 4. EWAN Escalation Audits
  await client.query(`
    CREATE TABLE IF NOT EXISTS ewan_escalation_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      bottleneck_id VARCHAR(100) NOT NULL,
      bottleneck_type VARCHAR(100) NOT NULL,
      urgency VARCHAR(50) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      department VARCHAR(100) NOT NULL,
      responsible_clinician VARCHAR(255) NOT NULL,
      elapsed_minutes INT NOT NULL,
      escalated_to_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
      whatsapp_status VARCHAR(50) NOT NULL DEFAULT 'DISPATCHED',
      soundbox_topic VARCHAR(100) NOT NULL,
      acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
      acknowledged_at TIMESTAMP WITH TIME ZONE,
      acknowledged_by VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ewan_escalations ON ewan_escalation_audits (tenant_id, urgency, acknowledged);
  `);
  console.log('  ✔ Table: ewan_escalation_audits ready');

  // 5. EWAN Executive Briefings
  await client.query(`
    CREATE TABLE IF NOT EXISTS ewan_executive_briefings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      briefing_date DATE NOT NULL DEFAULT CURRENT_DATE,
      briefing_type VARCHAR(50) NOT NULL DEFAULT 'MORNING_EXECUTIVE',
      voice_script_text TEXT NOT NULL,
      audio_duration_seconds INT NOT NULL DEFAULT 75,
      summary_bilingual JSONB NOT NULL,
      clinical_metrics JSONB NOT NULL,
      financial_metrics JSONB NOT NULL,
      nabh_score_pct NUMERIC(5, 2) NOT NULL DEFAULT 98.40,
      generated_by VARCHAR(255) NOT NULL DEFAULT 'EWAN 2.0 Autonomous Chief of Staff',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ewan_briefings ON ewan_executive_briefings (tenant_id, briefing_date);
  `);
  console.log('  ✔ Table: ewan_executive_briefings ready');

  // 6. EWAN NABH Statutory Binders
  await client.query(`
    CREATE TABLE IF NOT EXISTS ewan_nabh_statutory_binders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      audit_cycle VARCHAR(100) NOT NULL,
      compliance_score_pct NUMERIC(5, 2) NOT NULL DEFAULT 98.80,
      certified_hash VARCHAR(128) NOT NULL,
      chapters_evaluated JSONB NOT NULL,
      evidence_manifest JSONB NOT NULL,
      statutory_officer VARCHAR(255) NOT NULL,
      certified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ewan_nabh_binders ON ewan_nabh_statutory_binders (tenant_id, audit_cycle);
  `);
  console.log('  ✔ Table: ewan_nabh_statutory_binders ready');

  // Seed baseline data for testing and demonstrations
  // Seed Cashier Blind Drops
  await client.query(`
    INSERT INTO cashier_blind_drops (
      tenant_id, shift_id, cashier_name, pos_terminal_id,
      system_expected_cash, physical_drop_cash, variance_amount, variance_status, notes
    ) VALUES (
      $1, 'SHIFT-MORNING-POS1', 'Ramesh Kumar', 'POS-TERM-01',
      42500.00, 39800.00, -2700.00, 'UNRESOLVED_DISCREPANCY', 'Shortage noted in physical cash drawer during morning shift handoff'
    ) ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  // Seed Doctor Payout Clawback
  await client.query(`
    INSERT INTO doctor_payout_clawbacks (
      tenant_id, doctor_id, doctor_name, patient_uhid, invoice_number,
      refund_reason, clawback_amount, status
    ) VALUES (
      $1, 'DOC-CARDIO-001', 'Dr. Arvind Mehra (DM Cardiology)', 'UHID-2026-8912', 'INV-2026-90412',
      'Patient cancelled consult after payment; doctor share paid previously and requires clawback debit note',
      850.00, 'PENDING_DEBIT_NOTE'
    ) ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  console.log('  ✔ Seeded baseline EWAN operational data successfully.');
  await client.end();
  console.log('[✔] EWAN 2.0 Tables Migration Completed!');
}

migrate().catch((err) => {
  console.error('[!] Migration failed:', err);
  process.exit(1);
});
