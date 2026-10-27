// scripts/migrate-commercial-engine-tables.mjs
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function migrate() {
  console.log('🚀 Running DocSearch Commercial Engine PostgreSQL Migrations...');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const TENANT_ID = '6855be07-5298-4148-a571-c51ac49ac7f3';
  const ORG_ID = '5dd5c933-daca-4bfa-f53c-22e2cbd638d7';
  const PARTNER_ID = '417caac6-3f0a-49ca-afb8-1c419b27f19d';

  try {
    await client.query('BEGIN');

    // 1. Surgery EMI Applications
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.surgery_emi_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        organization_id UUID,
        partner_id UUID,
        patient_id UUID,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(50) NOT NULL,
        procedure_name VARCHAR(255) NOT NULL,
        package_amount NUMERIC(12,2) NOT NULL,
        down_payment NUMERIC(12,2) DEFAULT 0,
        loan_amount NUMERIC(12,2) NOT NULL,
        tenure_months INT NOT NULL,
        monthly_emi_amount NUMERIC(12,2) NOT NULL,
        subvention_rate_pct NUMERIC(5,2) DEFAULT 3.50,
        subvention_amount NUMERIC(12,2) NOT NULL,
        financing_partner VARCHAR(50) NOT NULL DEFAULT 'BAJAJ_FINSERV',
        cibil_score_band VARCHAR(50) DEFAULT '750_EXCELLENT',
        status VARCHAR(50) NOT NULL DEFAULT 'PRE_APPROVED',
        loan_reference_number VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Surgery Concierge Leads
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.surgery_concierge_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        organization_id UUID,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(50) NOT NULL,
        procedure_name VARCHAR(255) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        surgeon_name VARCHAR(255) NOT NULL,
        package_cost NUMERIC(12,2) NOT NULL,
        stage VARCHAR(50) NOT NULL DEFAULT 'CONSULTATION',
        emi_opted BOOLEAN DEFAULT FALSE,
        emi_tenure_months INT,
        monthly_emi_amount NUMERIC(12,2),
        tpa_approved_amount NUMERIC(12,2) DEFAULT 0,
        ot_date VARCHAR(100),
        ot_room VARCHAR(100),
        bed_assigned VARCHAR(100),
        care_buddy VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Doctor Payout Configurations
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.doctor_payout_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        organization_id UUID,
        doctor_id UUID,
        doctor_name VARCHAR(255) NOT NULL,
        opd_consultation_cut_pct NUMERIC(5,2) DEFAULT 70.00,
        hospital_facility_usage_cut_pct NUMERIC(5,2) DEFAULT 30.00,
        ipd_procedure_cut_pct NUMERIC(5,2) DEFAULT 75.00,
        emergency_night_surge_bonus_pct NUMERIC(5,2) DEFAULT 50.00,
        tds_rate_pct NUMERIC(5,2) DEFAULT 10.00,
        fixed_room_rental_deduction NUMERIC(12,2) DEFAULT 150.00,
        nmc_compliance_tag VARCHAR(100) DEFAULT 'CLINICAL_FACILITY_INFRASTRUCTURE_USAGE',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Doctor Settlement Vouchers
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.doctor_settlement_vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        organization_id UUID,
        voucher_number VARCHAR(100) NOT NULL UNIQUE,
        doctor_id UUID,
        doctor_name VARCHAR(255) NOT NULL,
        settlement_cycle VARCHAR(50) DEFAULT 'EOD_DAILY',
        period_start_date TIMESTAMPTZ NOT NULL,
        period_end_date TIMESTAMPTZ NOT NULL,
        total_consultations_count INT DEFAULT 0,
        gross_consultation_billed NUMERIC(12,2) NOT NULL,
        facility_usage_fee_deducted NUMERIC(12,2) NOT NULL,
        tds_deducted NUMERIC(12,2) NOT NULL,
        net_payable_to_doctor NUMERIC(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'GENERATED',
        nmc_ethics_declaration TEXT,
        transaction_reference VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Patient Care Passes (Subscriptions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.patient_care_passes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        patient_id UUID,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(50) NOT NULL,
        pass_code VARCHAR(100) NOT NULL,
        pass_tier VARCHAR(100) NOT NULL,
        annual_fee NUMERIC(12,2) NOT NULL,
        unlimited_opd_followups_active BOOLEAN DEFAULT TRUE,
        pharmacy_discount_pct NUMERIC(5,2) DEFAULT 15.00,
        free_home_collection_allowance INT DEFAULT 12,
        free_home_collection_used INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        auto_debit_webhook_active BOOLEAN DEFAULT TRUE,
        churn_risk VARCHAR(50) DEFAULT 'LOW',
        expiry_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Patient Health Wallets
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.patient_health_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        patient_id UUID,
        patient_phone VARCHAR(50) NOT NULL,
        wallet_balance NUMERIC(12,2) DEFAULT 0.00,
        bonus_credit_balance NUMERIC(12,2) DEFAULT 0.00,
        total_saved_lifetime NUMERIC(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Pharmacy Generic PMBJP Substitutions
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.pharmacy_generic_substitutions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        brand_medication_name VARCHAR(255) NOT NULL,
        brand_composition VARCHAR(255) NOT NULL,
        brand_pack_size VARCHAR(100),
        brand_mrp NUMERIC(12,2) NOT NULL,
        pmbjp_generic_name VARCHAR(255) NOT NULL,
        pmbjp_generic_code VARCHAR(100) NOT NULL,
        pmbjp_mrp NUMERIC(12,2) NOT NULL,
        patient_savings_pct NUMERIC(5,2) NOT NULL,
        hospital_margin_pct NUMERIC(5,2) NOT NULL,
        in_stock_batches_count INT DEFAULT 4,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Pharmacy Chronic Refill Radars
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.pharmacy_chronic_refill_radars (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        patient_id UUID,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(50) NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        daily_dosage_pills INT DEFAULT 1,
        days_supplied INT DEFAULT 30,
        dispensed_date TIMESTAMPTZ NOT NULL,
        exhaustion_due_date TIMESTAMPTZ NOT NULL,
        days_remaining INT DEFAULT 3,
        whatsapp_refill_dispatched BOOLEAN DEFAULT FALSE,
        reorder_status VARCHAR(50) DEFAULT 'RADAR_ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 9. Phlebotomist Fleets
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.phlebotomist_fleets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        phlebotomist_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(50) NOT NULL,
        current_geo_zone VARCHAR(100) NOT NULL,
        assigned_vehicle VARCHAR(50) DEFAULT 'TWO_WHEELER_EV',
        duty_status VARCHAR(50) DEFAULT 'ON_DUTY',
        today_pickups_completed INT DEFAULT 0,
        total_earnings_today NUMERIC(12,2) DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 10. Home Collection Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.home_collection_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        order_number VARCHAR(100) NOT NULL UNIQUE,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(50) NOT NULL,
        patient_address TEXT NOT NULL,
        geo_zone VARCHAR(100) NOT NULL,
        tests_requested TEXT NOT NULL,
        scheduled_slot VARCHAR(100) NOT NULL,
        phlebotomist_id UUID,
        phlebotomist_name VARCHAR(255),
        vacutainer_barcode VARCHAR(100),
        cold_chain_celsius NUMERIC(4,1) DEFAULT 4.0,
        cold_chain_status VARCHAR(50) DEFAULT 'OPTIMAL_CHILLED',
        convenience_surcharge_fee NUMERIC(12,2) DEFAULT 150.00,
        phlebotomist_split_fee NUMERIC(12,2) DEFAULT 90.00,
        lab_split_fee NUMERIC(12,2) DEFAULT 60.00,
        status VARCHAR(50) DEFAULT 'SCHEDULED',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 11. RCM Pre-Auth Scrubber Rules
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.rcm_preauth_scrubber_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_code VARCHAR(100) NOT NULL UNIQUE,
        rule_category VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL DEFAULT 'CRITICAL_DENIAL_RISK',
        description TEXT NOT NULL,
        irdai_norm_reference VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 12. RCM Claim Scrub Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.rcm_claim_scrub_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        claim_number VARCHAR(100) NOT NULL,
        patient_uhid VARCHAR(100) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        procedure_name VARCHAR(255) NOT NULL,
        proposed_claim_amount NUMERIC(12,2) NOT NULL,
        scrubber_score INT NOT NULL DEFAULT 85,
        denial_probability_pct NUMERIC(5,2) NOT NULL DEFAULT 12.50,
        flagged_violations_count INT NOT NULL DEFAULT 0,
        detected_leakage_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        findings JSONB DEFAULT '[]'::jsonb,
        scrub_status VARCHAR(50) DEFAULT 'CLEAN_SUBMIT_APPROVED',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // SEED INITIAL COMMERCIAL RECORDS

    // Seed PMBJP Generic Substitutions
    await client.query(`
      INSERT INTO clinical.pharmacy_generic_substitutions 
        (tenant_id, brand_medication_name, brand_composition, brand_pack_size, brand_mrp, pmbjp_generic_name, pmbjp_generic_code, pmbjp_mrp, patient_savings_pct, hospital_margin_pct, in_stock_batches_count)
      VALUES 
        ('${TENANT_ID}', 'Augmentin 625 Duo', 'Amoxycillin (500mg) + Clavulanic Acid (125mg)', '10 Tablets Strip', 204.50, 'Amoxycillin and Potassium Clavulanate Tablets IP 625mg', 'PMBJP-TAB-0082', 48.00, 76.53, 62.50, 6),
        ('${TENANT_ID}', 'Pan D Capsule', 'Pantoprazole (40mg) + Domperidone (30mg)', '15 Capsules Strip', 199.00, 'Pantoprazole Gastro-resistant and Domperidone Prolonged-release', 'PMBJP-CAP-0312', 32.50, 83.67, 68.00, 12),
        ('${TENANT_ID}', 'Glycomet GP 1', 'Metformin (500mg) + Glimepiride (1mg)', '15 Tablets Strip', 142.00, 'Glimepiride and Metformin Hydrochloride Tablets IP', 'PMBJP-TAB-0199', 24.00, 83.10, 65.00, 8),
        ('${TENANT_ID}', 'Telma 40', 'Telmisartan (40mg)', '30 Tablets Strip', 228.00, 'Telmisartan Tablets IP 40mg', 'PMBJP-TAB-0418', 38.00, 83.33, 71.00, 15),
        ('${TENANT_ID}', 'Rosuvas 10', 'Rosuvastatin (10mg)', '15 Tablets Strip', 255.00, 'Rosuvastatin Tablets IP 10mg', 'PMBJP-TAB-0388', 42.00, 83.53, 64.00, 9)
      ON CONFLICT DO NOTHING;
    `);

    // Seed RCM Pre-Auth Scrubber Rules (IRDAI / NHCX 2.0 45 Standard Triggers)
    await client.query(`
      INSERT INTO clinical.rcm_preauth_scrubber_rules
        (rule_code, rule_category, severity, description, irdai_norm_reference)
      VALUES
        ('RCM-RULE-01', 'DIAGNOSTIC_JUSTIFICATION', 'CRITICAL_DENIAL_RISK', 'Missing ultrasound or histopathology report justifying surgical laparoscopic intervention.', 'IRDAI Guidelines Sec 4.2(a)'),
        ('RCM-RULE-02', 'NON_PAYABLE_CONSUMABLE', 'WARNING_MARGIN_LEAKAGE', 'Gloves, PPE, and cotton rolls billed under patient line items without TPA consumable rider.', 'GIPSA Non-Medical Items Schedule I'),
        ('RCM-RULE-03', 'LOS_BENCHMARK', 'CRITICAL_DENIAL_RISK', 'Length of stay exceeds standard benchmark for daycare laparoscopic cholecystectomy (>24h).', 'NHCX Clinical Pathway Master v2'),
        ('RCM-RULE-04', 'IMPLANT_INVOICE_MISSING', 'CRITICAL_DENIAL_RISK', 'Orthopedic knee / cardiac stent implant serial barcode invoice not attached in pre-auth annexure.', 'NPPA Stent Ceiling Order 2024'),
        ('RCM-RULE-05', 'PRE_AUTH_TIMELINE', 'CRITICAL_DENIAL_RISK', 'Planned admission pre-authorization requested less than 48 hours prior to admission date.', 'Star Health / ICICI Lombard Cashless SLA')
      ON CONFLICT (rule_code) DO NOTHING;
    `);

    // Seed Phlebotomist Fleets
    await client.query(`
      INSERT INTO clinical.phlebotomist_fleets
        (tenant_id, phlebotomist_name, mobile_number, current_geo_zone, assigned_vehicle, duty_status, today_pickups_completed, total_earnings_today)
      VALUES
        ('${TENANT_ID}', 'Deepak Verma', '+91 98112 00441', 'South Delhi - Green Park & Hauz Khas', 'TWO_WHEELER_EV', 'ON_DUTY', 6, 540.00),
        ('${TENANT_ID}', 'Manish Kumar', '+91 98711 33221', 'Noida Sector 62 & Indirapuram', 'TWO_WHEELER_EV', 'IN_TRANSIT', 4, 360.00),
        ('${TENANT_ID}', 'Sunil Rawat', '+91 99100 88223', 'Gurugram Cyber City & DLF Phase 3', 'TWO_WHEELER_EV', 'ON_DUTY', 8, 720.00)
      ON CONFLICT DO NOTHING;
    `);

    // Seed Home Collection Orders
    await client.query(`
      INSERT INTO clinical.home_collection_orders
        (tenant_id, order_number, patient_name, patient_phone, patient_address, geo_zone, tests_requested, scheduled_slot, vacutainer_barcode, cold_chain_celsius, cold_chain_status, convenience_surcharge_fee, phlebotomist_split_fee, lab_split_fee, status)
      VALUES
        ('${TENANT_ID}', 'HCO-2026-881', 'Col. R. S. Rathore (Retd.)', '+91 98101 44552', 'B-4/12, Safdarjung Enclave, New Delhi', 'South Delhi', 'Complete Blood Count (CBC) + HbA1c + Lipid Profile', '07:30 AM - 08:30 AM', 'VAC-EDTA-8812', 3.8, 'OPTIMAL_CHILLED', 150.00, 90.00, 60.00, 'SAMPLE_COLLECTED_CHILLED'),
        ('${TENANT_ID}', 'HCO-2026-882', 'Mrs. Meenakshi Sundaram', '+91 99882 11443', 'Flat 402, Shipra Sun City, Indirapuram', 'Noida / Ghaziabad', 'Thyroid Profile (T3, T4, TSH) + Vitamin D3 & B12', '08:30 AM - 09:30 AM', 'VAC-SERUM-8813', 4.1, 'OPTIMAL_CHILLED', 150.00, 90.00, 60.00, 'DISPATCHED')
      ON CONFLICT (order_number) DO NOTHING;
    `);

    // Seed Doctor Payout Configuration for Dr. Vivek Sharma & Dr. Neha Agarwal
    await client.query(`
      INSERT INTO clinical.doctor_payout_configurations
        (tenant_id, organization_id, doctor_name, opd_consultation_cut_pct, hospital_facility_usage_cut_pct, ipd_procedure_cut_pct, emergency_night_surge_bonus_pct, tds_rate_pct, fixed_room_rental_deduction, nmc_compliance_tag, status)
      VALUES
        ('${TENANT_ID}', '${ORG_ID}', 'Dr. Vivek Sharma (MS Gen Surg)', 70.00, 30.00, 75.00, 50.00, 10.00, 150.00, 'CLINICAL_FACILITY_INFRASTRUCTURE_USAGE', 'ACTIVE'),
        ('${TENANT_ID}', '${ORG_ID}', 'Dr. Rajesh Gupta (MS Ortho)', 75.00, 25.00, 80.00, 50.00, 10.00, 200.00, 'CLINICAL_FACILITY_INFRASTRUCTURE_USAGE', 'ACTIVE'),
        ('${TENANT_ID}', '${ORG_ID}', 'Dr. Neha Agarwal (MS Eye)', 70.00, 30.00, 70.00, 50.00, 10.00, 150.00, 'CLINICAL_FACILITY_INFRASTRUCTURE_USAGE', 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Surgery Concierge Leads
    await client.query(`
      INSERT INTO clinical.surgery_concierge_leads
        (tenant_id, organization_id, patient_name, patient_phone, procedure_name, specialty, surgeon_name, package_cost, stage, emi_opted, emi_tenure_months, monthly_emi_amount, tpa_approved_amount, ot_date, ot_room, bed_assigned, care_buddy)
      VALUES
        ('${TENANT_ID}', '${ORG_ID}', 'Rameshwar Dayal', '+91 98112 33441', 'Laparoscopic Cholecystectomy (Gallbladder)', 'Minimal Access GI Surgery', 'Dr. Vivek Sharma (MS Gen Surg)', 65000.00, 'OT_SCHEDULED', true, 6, 10833.00, 60000.00, 'Tomorrow, 09:30 AM', 'OT-02 (Modular Laparoscopy)', 'Deluxe-204', 'Sister Sunita (Dedicated Care Buddy)'),
        ('${TENANT_ID}', '${ORG_ID}', 'Kamla Devi', '+91 98765 11223', 'Cataract Surgery (Phaco + Trifocal IOL)', 'Ophthalmology', 'Dr. Neha Agarwal (MS Eye)', 38000.00, 'PAC_CLEARANCE', false, null, null, 35000.00, 'Pending PAC Clearance', 'OT-04 (Eye Ophthal Microlab)', 'DayCare-06', 'Brother Amit (Care Concierge)'),
        ('${TENANT_ID}', '${ORG_ID}', 'Sanjay Rawat', '+91 97188 55442', 'Laser Piles & Fistula Ablation (SiLaC)', 'Colorectal Proctology', 'Dr. Vivek Sharma (MS Gen Surg)', 45000.00, 'TPA_PREAUTH', true, 12, 3750.00, 42000.00, 'Awaiting TPA Stamp', 'OT-01 (General Surgery)', 'Private-108', 'Sister Sunita (Dedicated Care Buddy)')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Patient Chronic Refill Radars
    await client.query(`
      INSERT INTO clinical.pharmacy_chronic_refill_radars
        (tenant_id, patient_name, patient_phone, medication_name, daily_dosage_pills, days_supplied, dispensed_date, exhaustion_due_date, days_remaining, whatsapp_refill_dispatched, reorder_status)
      VALUES
        ('${TENANT_ID}', 'Harish Chander Kapoor', '+91 98110 33445', 'Telma 40mg (Telmisartan)', 1, 30, NOW() - INTERVAL '27 days', NOW() + INTERVAL '3 days', 3, false, 'RADAR_ACTIVE'),
        ('${TENANT_ID}', 'Shashi Prabha', '+91 98712 55441', 'Glycomet GP 1 (Metformin + Glimepiride)', 2, 30, NOW() - INTERVAL '28 days', NOW() + INTERVAL '2 days', 2, false, 'RADAR_ACTIVE'),
        ('${TENANT_ID}', 'Gopal Das Gupta', '+91 99114 66778', 'Rosuvas 10mg (Rosuvastatin)', 1, 30, NOW() - INTERVAL '29 days', NOW() + INTERVAL '1 days', 1, true, 'WHATSAPP_DISPATCHED')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Patient Care Passes
    await client.query(`
      INSERT INTO clinical.patient_care_passes
        (tenant_id, patient_name, patient_phone, pass_code, pass_tier, annual_fee, unlimited_opd_followups_active, pharmacy_discount_pct, free_home_collection_allowance, free_home_collection_used, status, auto_debit_webhook_active, churn_risk, expiry_date)
      VALUES
        ('${TENANT_ID}', 'Vikram Malhotra', '+91 98100 12345', 'PASS-FAM-2026-001', 'CARE_FAMILY_999', 999.00, true, 15.00, 12, 2, 'ACTIVE', true, 'LOW', NOW() + INTERVAL '320 days'),
        ('${TENANT_ID}', 'Anita Anand', '+91 98765 43210', 'PASS-CHRON-2026-002', 'CARE_CHRONIC_199', 199.00, true, 15.00, 6, 1, 'ACTIVE', true, 'LOW', NOW() + INTERVAL '28 days')
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ PostgreSQL migrations and seeding for all 6 commercial engine pillars completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
