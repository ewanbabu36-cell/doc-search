import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT = '6855be07-5298-4148-a571-c51ac49ac7f3';

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('[*] Connected to PostgreSQL 18.4. Executing Clinical Operations & Safety tables migration...');

  // 1. OT Surgical Missions & Safety
  await client.query(`
    CREATE TABLE IF NOT EXISTS ot_surgical_missions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      case_id VARCHAR(100) NOT NULL UNIQUE,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      procedure_name VARCHAR(255) NOT NULL,
      ot_theatre_name VARCHAR(100) NOT NULL,
      chief_surgeon VARCHAR(255) NOT NULL,
      anaesthetist_name VARCHAR(255) NOT NULL,
      pac_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      pac_notes JSONB,
      checklist_phase VARCHAR(50) NOT NULL DEFAULT 'SIGN_IN_PENDING',
      current_safety_status VARCHAR(50) NOT NULL DEFAULT 'READY_FOR_SIGN_IN',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ot_missions_tenant ON ot_surgical_missions (tenant_id, case_id);
  `);
  console.log('  ✔ Table: ot_surgical_missions ready');

  // 2. OT Safety Checklists
  await client.query(`
    CREATE TABLE IF NOT EXISTS ot_safety_checklists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      case_id VARCHAR(100) NOT NULL,
      phase VARCHAR(50) NOT NULL,
      verified_items JSONB NOT NULL,
      verified_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ot_checklists_case ON ot_safety_checklists (tenant_id, case_id);
  `);
  console.log('  ✔ Table: ot_safety_checklists ready');

  // 3. OT Sponge & Needle Counts
  await client.query(`
    CREATE TABLE IF NOT EXISTS ot_sponge_needle_counts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      case_id VARCHAR(100) NOT NULL,
      item_type VARCHAR(100) NOT NULL,
      initial_count INT NOT NULL,
      added_count INT NOT NULL DEFAULT 0,
      final_closing_count INT NOT NULL,
      discrepancy_count INT NOT NULL DEFAULT 0,
      scrub_nurse_sign VARCHAR(255) NOT NULL,
      circulating_nurse_sign VARCHAR(255) NOT NULL,
      reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'BALANCED',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ot_counts_case ON ot_sponge_needle_counts (tenant_id, case_id);
  `);
  console.log('  ✔ Table: ot_sponge_needle_counts ready');

  // 4. CSSD Sterile Batches
  await client.query(`
    CREATE TABLE IF NOT EXISTS cssd_sterile_batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      batch_number VARCHAR(100) NOT NULL UNIQUE,
      tray_name VARCHAR(255) NOT NULL,
      autoclave_cycle_id VARCHAR(100) NOT NULL,
      biological_indicator_result VARCHAR(50) NOT NULL DEFAULT 'NEGATIVE_PASS',
      sterilization_date TIMESTAMP WITH TIME ZONE NOT NULL,
      expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'STERILE_ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_cssd_tenant ON cssd_sterile_batches (tenant_id);
  `);
  console.log('  ✔ Table: cssd_sterile_batches ready');

  // 5. Inpatient Bedside Call Bell Events
  await client.query(`
    CREATE TABLE IF NOT EXISTS bedside_call_bell_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      event_id VARCHAR(100) NOT NULL UNIQUE,
      bed_number VARCHAR(50) NOT NULL,
      ward_name VARCHAR(100) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      call_type VARCHAR(50) NOT NULL DEFAULT 'EMERGENCY_ASSIST',
      triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      acknowledged_at TIMESTAMP WITH TIME ZONE,
      acknowledged_by VARCHAR(255),
      sla_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_UNDER_SLA',
      escalation_tier INT NOT NULL DEFAULT 0,
      escalation_log JSONB DEFAULT '[]'::jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_bedside_bell_tenant ON bedside_call_bell_events (tenant_id, bed_number);
  `);
  console.log('  ✔ Table: bedside_call_bell_events ready');

  // 6. Bedside IV Telemetry Logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS bedside_iv_telemetry_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      bed_number VARCHAR(50) NOT NULL,
      iv_bottle_type VARCHAR(100) NOT NULL,
      current_fluid_ml INT NOT NULL,
      flow_rate_ml_hr INT NOT NULL,
      low_fluid_alert BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_iv_telemetry_bed ON bedside_iv_telemetry_logs (tenant_id, bed_number);
  `);
  console.log('  ✔ Table: bedside_iv_telemetry_logs ready');

  // 7. Bedside Dietary Orders
  await client.query(`
    CREATE TABLE IF NOT EXISTS bedside_dietary_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      order_id VARCHAR(100) NOT NULL UNIQUE,
      bed_number VARCHAR(50) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      meal_type VARCHAR(50) NOT NULL,
      diet_category VARCHAR(100) NOT NULL,
      items JSONB NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'KITCHEN_PREPARING',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('  ✔ Table: bedside_dietary_orders ready');

  // 8. Pharmacy POS Inventory Batches (GS1 Barcodes & FEFO)
  await client.query(`
    CREATE TABLE IF NOT EXISTS pharmacy_pos_inventory_batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      item_code VARCHAR(100) NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      gtin_barcode VARCHAR(100) NOT NULL,
      batch_number VARCHAR(100) NOT NULL,
      expiry_date DATE NOT NULL,
      mrp NUMERIC(10, 2) NOT NULL,
      purchase_rate NUMERIC(10, 2) NOT NULL,
      stock_qty INT NOT NULL,
      is_schedule_h1 BOOLEAN NOT NULL DEFAULT FALSE,
      is_narcotic BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pharma_batches_gtin ON pharmacy_pos_inventory_batches (tenant_id, gtin_barcode);
    CREATE INDEX IF NOT EXISTS idx_pharma_batches_fefo ON pharmacy_pos_inventory_batches (tenant_id, item_code, expiry_date ASC);
  `);
  console.log('  ✔ Table: pharmacy_pos_inventory_batches ready');

  // 9. Pharmacy POS Transactions
  await client.query(`
    CREATE TABLE IF NOT EXISTS pharmacy_pos_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      invoice_number VARCHAR(100) NOT NULL UNIQUE,
      patient_uhid VARCHAR(100),
      patient_name VARCHAR(255),
      items_json JSONB NOT NULL,
      gross_amount NUMERIC(10, 2) NOT NULL,
      discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      net_amount NUMERIC(10, 2) NOT NULL,
      payment_mode VARCHAR(50) NOT NULL,
      cashier_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('  ✔ Table: pharmacy_pos_transactions ready');

  // 10. Pharmacy Schedule H1 Narcotics Register
  await client.query(`
    CREATE TABLE IF NOT EXISTS pharmacy_schedule_h1_register (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      entry_id VARCHAR(100) NOT NULL UNIQUE,
      drug_name VARCHAR(255) NOT NULL,
      batch_number VARCHAR(100) NOT NULL,
      quantity_dispensed INT NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      patient_id_proof VARCHAR(100) NOT NULL,
      prescribing_doctor_name VARCHAR(255) NOT NULL,
      doctor_reg_number VARCHAR(100) NOT NULL,
      dispensing_pharmacist_sign VARCHAR(255) NOT NULL,
      medical_superintendent_sign VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('  ✔ Table: pharmacy_schedule_h1_register ready');

  // 11. Ayushman Bharat PM-JAY HBP 2.2 Packages
  await client.query(`
    CREATE TABLE IF NOT EXISTS pmjay_hbp_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      package_code VARCHAR(100) NOT NULL UNIQUE,
      package_name VARCHAR(255) NOT NULL,
      specialty VARCHAR(100) NOT NULL,
      package_tariff NUMERIC(10, 2) NOT NULL,
      preauth_required BOOLEAN NOT NULL DEFAULT TRUE,
      standard_alos_days INT NOT NULL DEFAULT 3,
      mandatory_docs JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `);
  console.log('  ✔ Table: pmjay_hbp_packages ready');

  // 12. PM-JAY Beneficiary Cases
  await client.query(`
    CREATE TABLE IF NOT EXISTS pmjay_beneficiary_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      case_ref VARCHAR(100) NOT NULL UNIQUE,
      beneficiary_name VARCHAR(255) NOT NULL,
      golden_card_id VARCHAR(100) NOT NULL,
      ration_card_number VARCHAR(100) NOT NULL,
      state_name VARCHAR(100) NOT NULL,
      package_code VARCHAR(100) NOT NULL,
      preauth_status VARCHAR(50) NOT NULL DEFAULT 'PREAUTH_APPROVED',
      approved_amount NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('  ✔ Table: pmjay_beneficiary_cases ready');

  // 13. PM-JAY Claims Ledger
  await client.query(`
    CREATE TABLE IF NOT EXISTS pmjay_claims_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      claim_id VARCHAR(100) NOT NULL UNIQUE,
      case_ref VARCHAR(100) NOT NULL,
      package_code VARCHAR(100) NOT NULL,
      billed_amount NUMERIC(10, 2) NOT NULL,
      sha_payable_amount NUMERIC(10, 2) NOT NULL,
      patient_out_of_pocket NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      adjudication_status VARCHAR(50) NOT NULL DEFAULT 'APPROVED_FOR_DISBURSEMENT',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('  ✔ Table: pmjay_claims_ledger ready');

  // 14. Blood Bank Cold Chain Logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS blood_bank_cold_chain_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      storage_unit_id VARCHAR(100) NOT NULL,
      unit_type VARCHAR(100) NOT NULL,
      current_temperature NUMERIC(4, 1) NOT NULL,
      min_allowed_temp NUMERIC(4, 1) NOT NULL,
      max_allowed_temp NUMERIC(4, 1) NOT NULL,
      breach_detected BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('  ✔ Table: blood_bank_cold_chain_logs ready');

  // 15. Blood Bank Unit Inventory
  await client.query(`
    CREATE TABLE IF NOT EXISTS blood_bank_unit_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      unit_barcode VARCHAR(100) NOT NULL UNIQUE,
      blood_group VARCHAR(30) NOT NULL,
      component_type VARCHAR(50) NOT NULL,
      donation_date DATE NOT NULL,
      expiry_date DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE_UNRESERVED',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ALTER TABLE blood_bank_unit_inventory ALTER COLUMN blood_group TYPE VARCHAR(30);
    CREATE INDEX IF NOT EXISTS idx_blood_units_group ON blood_bank_unit_inventory (tenant_id, blood_group, status);
  `);
  console.log('  ✔ Table: blood_bank_unit_inventory ready');

  // 16. Blood Bank Crossmatch Reservations
  await client.query(`
    CREATE TABLE IF NOT EXISTS blood_bank_crossmatch_reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      reservation_id VARCHAR(100) NOT NULL UNIQUE,
      unit_barcode VARCHAR(100) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      planned_surgery_name VARCHAR(255) NOT NULL,
      reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      reservation_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_SURGERY_HOLD',
      released_at TIMESTAMP WITH TIME ZONE
    );
    CREATE INDEX IF NOT EXISTS idx_blood_res_status ON blood_bank_crossmatch_reservations (tenant_id, reservation_status);
  `);
  console.log('  ✔ Table: blood_bank_crossmatch_reservations ready');

  // --- SEED SECTOR MASTER DATA ---
  console.log('[*] Seeding baseline clinical master data...');

  // CSSD Batches
  await client.query(`
    INSERT INTO cssd_sterile_batches (tenant_id, batch_number, tray_name, autoclave_cycle_id, biological_indicator_result, sterilization_date, expiry_date, status)
    VALUES
      ($1, 'CSSD-BATCH-2026-901', 'Major Laparotomy Instrument Set #04', 'AUTO-CYCL-8841', 'NEGATIVE_PASS', NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 'STERILE_ACTIVE'),
      ($1, 'CSSD-BATCH-2026-902', 'Orthopedic Total Knee Replacement Set #02', 'AUTO-CYCL-8842', 'NEGATIVE_PASS', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 'STERILE_ACTIVE'),
      ($1, 'CSSD-BATCH-2026-903', 'Emergency Poly-Trauma Vascular Tray #01', 'AUTO-CYCL-8843', 'NEGATIVE_PASS', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '30 days', 'STERILE_ACTIVE')
    ON CONFLICT (batch_number) DO NOTHING;
  `, [ACTIVE_TENANT]);

  // Pharmacy Batches (GS1 barcodes, FEFO, Schedule H1)
  await client.query(`
    INSERT INTO pharmacy_pos_inventory_batches (tenant_id, item_code, item_name, gtin_barcode, batch_number, expiry_date, mrp, purchase_rate, stock_qty, is_schedule_h1, is_narcotic)
    VALUES
      ($1, 'MED-AUG-625', 'Augmentin 625 Duo Tablets (10s)', '08901234567891', 'B-AUG-2611', '2026-11-30', 223.50, 160.00, 45, TRUE, FALSE),
      ($1, 'MED-AUG-625', 'Augmentin 625 Duo Tablets (10s)', '08901234567891', 'B-AUG-2712', '2027-12-31', 228.00, 162.00, 120, TRUE, FALSE),
      ($1, 'MED-FNT-50', 'Fentanyl Citrate Injection 50mcg/ml 2ml', '08909876543210', 'B-FNT-2610', '2026-10-31', 145.00, 95.00, 30, TRUE, TRUE),
      ($1, 'MED-PCM-650', 'Dolo 650 Tablets (15s)', '08904567890123', 'B-PCM-2612', '2026-12-31', 34.00, 21.00, 300, FALSE, FALSE)
    ON CONFLICT DO NOTHING;
  `, [ACTIVE_TENANT]);

  // PM-JAY HBP 2.2 Packages
  await client.query(`
    INSERT INTO pmjay_hbp_packages (package_code, package_name, specialty, package_tariff, preauth_required, standard_alos_days, mandatory_docs)
    VALUES
      ('SU004', 'Laparoscopic Cholecystectomy with Cholangiogram', 'General Surgery', 32000.00, TRUE, 3, '["Ultrasound Abdomen", "LFT Report", "Clinical History", "PMJAY Golden Card"]'::jsonb),
      ('OR012', 'Total Knee Arthroplasty (Unilateral with Implants)', 'Orthopedics', 95000.00, TRUE, 5, '["X-Ray Knee AP/Lat", "Implant Invoice", "Pre-Op Photos", "PMJAY Golden Card"]'::jsonb),
      ('CA001', 'Coronary Angiography (Radial / Femoral)', 'Cardiology', 14000.00, FALSE, 1, '["ECG", "Troponin I", "Cardiologist Clinical Note", "PMJAY Golden Card"]'::jsonb),
      ('MG001', 'ICU Management of Severe Septic Shock (Per Day Package)', 'Critical Care', 18500.00, TRUE, 4, '["ABG", "Blood Culture", "Procalcitonin", "Ventilator Flowsheet"]'::jsonb)
    ON CONFLICT (package_code) DO NOTHING;
  `);

  // Blood Bank Unit Inventory
  await client.query(`
    INSERT INTO blood_bank_unit_inventory (tenant_id, unit_barcode, blood_group, component_type, donation_date, expiry_date, status)
    VALUES
      ($1, 'BLD-PRBC-O-POS-9001', 'O_POSITIVE', 'PRBC', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '32 days', 'AVAILABLE_UNRESERVED'),
      ($1, 'BLD-PRBC-O-NEG-9002', 'O_NEGATIVE', 'PRBC', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '37 days', 'AVAILABLE_UNRESERVED'),
      ($1, 'BLD-PRBC-B-POS-9003', 'B_POSITIVE', 'PRBC', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '27 days', 'AVAILABLE_UNRESERVED'),
      ($1, 'BLD-PLT-AB-POS-9004', 'AB_POSITIVE', 'PLATELETS', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', 'AVAILABLE_UNRESERVED'),
      ($1, 'BLD-FFP-A-POS-9005', 'A_POSITIVE', 'FFP', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'AVAILABLE_UNRESERVED')
    ON CONFLICT (unit_barcode) DO NOTHING;
  `, [ACTIVE_TENANT]);

  console.log('[✔] All Clinical Operations & Safety tables & baseline seeds successfully migrated into PostgreSQL 18.4!');
  await client.end();
}

migrate().catch((err) => {
  console.error('[!] Migration failed:', err);
  process.exit(1);
});
