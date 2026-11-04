import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('[*] Connected to PostgreSQL 18.4. Executing Market-Frontier tables migration...');

  // 1. Radiology & ECG AI Computer Vision Findings
  await client.query(`
    CREATE TABLE IF NOT EXISTS radiology_ai_findings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      study_uid VARCHAR(150) NOT NULL,
      modality VARCHAR(50) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      critical_alert BOOLEAN DEFAULT FALSE,
      primary_finding TEXT NOT NULL,
      confidence_pct NUMERIC(5, 2) NOT NULL,
      heatmap_coordinates_json JSONB,
      status VARCHAR(50) NOT NULL DEFAULT 'ANALYZED',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_radiology_ai_tenant ON radiology_ai_findings (tenant_id);
    CREATE INDEX IF NOT EXISTS idx_radiology_ai_critical ON radiology_ai_findings (critical_alert);
  `);
  console.log('  ✔ Table: radiology_ai_findings ready');

  // 2. Smart ICU Telemetry & NEWS2 Early Warning Logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS smart_icu_telemetry_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      bed_number VARCHAR(50) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      heart_rate INTEGER NOT NULL,
      systolic_bp INTEGER NOT NULL,
      respiratory_rate INTEGER NOT NULL,
      spo2 INTEGER NOT NULL,
      temperature NUMERIC(4, 1) NOT NULL,
      avpu VARCHAR(20) NOT NULL DEFAULT 'ALERT',
      news2_score INTEGER NOT NULL,
      deterioration_risk VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_smart_icu_tenant_bed ON smart_icu_telemetry_logs (tenant_id, bed_number);
  `);
  console.log('  ✔ Table: smart_icu_telemetry_logs ready');

  // 3. 5G Smart Ambulance Tele-Emergency Missions
  await client.query(`
    CREATE TABLE IF NOT EXISTS smart_ambulance_missions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      ambulance_vehicle_number VARCHAR(50) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      gps_latitude NUMERIC(10, 6),
      gps_longitude NUMERIC(10, 6),
      eta_minutes INTEGER NOT NULL DEFAULT 15,
      vital_heart_rate INTEGER,
      vital_spo2 INTEGER,
      vital_bp VARCHAR(50),
      trauma_bay_staged BOOLEAN DEFAULT FALSE,
      ot_reserved VARCHAR(50),
      blood_units_crossmatched INTEGER DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'EN_ROUTE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ambulance_tenant ON smart_ambulance_missions (tenant_id, status);
  `);
  console.log('  ✔ Table: smart_ambulance_missions ready');

  // 4. Corporate B2B Accounts & Monthly Consolidated Ledgers
  await client.query(`
    CREATE TABLE IF NOT EXISTS corporate_b2b_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      contract_code VARCHAR(100) UNIQUE NOT NULL,
      total_enrolled_employees INTEGER NOT NULL DEFAULT 0,
      monthly_allowance_per_emp NUMERIC(10, 2) NOT NULL DEFAULT 0,
      current_month_billed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      gstin VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_corporate_b2b_tenant ON corporate_b2b_accounts (tenant_id);
  `);
  console.log('  ✔ Table: corporate_b2b_accounts ready');

  // 5. Autonomous Bed Turnaround & Housekeeping Missions
  await client.query(`
    CREATE TABLE IF NOT EXISTS bed_turnaround_missions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      bed_id VARCHAR(100) NOT NULL,
      bed_number VARCHAR(50) NOT NULL,
      ward_name VARCHAR(100) NOT NULL,
      discharged_patient_name VARCHAR(255) NOT NULL,
      cleaning_staff_name VARCHAR(255),
      cleaning_status VARCHAR(50) NOT NULL DEFAULT 'DISPATCHED',
      dispatch_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      start_time TIMESTAMP WITH TIME ZONE,
      completion_time TIMESTAMP WITH TIME ZONE,
      turnaround_minutes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_bed_turnaround_tenant ON bed_turnaround_missions (tenant_id, cleaning_status);
  `);
  console.log('  ✔ Table: bed_turnaround_missions ready');

  // Seed sample corporate B2B clients if table empty
  const corpCount = await client.query('SELECT COUNT(*) FROM corporate_b2b_accounts');
  if (parseInt(corpCount.rows[0].count) === 0) {
    const corporates = [
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'Tata Consultancy Services (TCS)', 'CORP-TCS-2026', 1450, 1500, 217500, '27AAACT2727Q1ZW'],
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'Infosys Technologies Ltd', 'CORP-INFY-2026', 820, 1500, 123000, '29AAACI4321A1ZK'],
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'Reliance Jio Infocomm', 'CORP-JIO-2026', 2200, 2000, 440000, '27AAACR1234D1ZP']
    ];

    for (const [tId, name, code, emps, allow, billed, gst] of corporates) {
      await client.query(`
        INSERT INTO corporate_b2b_accounts (tenant_id, company_name, contract_code, total_enrolled_employees, monthly_allowance_per_emp, current_month_billed_amount, gstin)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tId, name, code, emps, allow, billed, gst]);
    }
    console.log(`  ✔ Seeded ${corporates.length} corporate enterprise accounts`);
  }

  await client.end();
  console.log('[✔] Market-Frontier tables migration complete!\n');
}

migrate().catch((err) => {
  console.error('[!] Migration failed:', err);
  process.exit(1);
});
