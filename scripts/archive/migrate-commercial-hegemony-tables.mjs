// scripts/migrate-commercial-hegemony-tables.mjs
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function migrate() {
  console.log('🚀 Running DocSearch Complete Commercial Hegemony PostgreSQL Migrations...');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const TENANT_ID = '6855be07-5298-4148-a571-c51ac49ac7f3';
  const ORG_ID = '5dd5c933-daca-4bfa-f53c-22e2cbd638d7';

  try {
    await client.query('BEGIN');

    // 1. Doctor Volume Payout Tiers
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.doctor_volume_payout_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        doctor_id UUID,
        doctor_name VARCHAR(255) NOT NULL,
        tier_label VARCHAR(100) NOT NULL,
        min_consultations INT NOT NULL,
        max_consultations INT NOT NULL,
        doctor_split_pct NUMERIC(5,2) NOT NULL,
        clinic_margin_pct NUMERIC(5,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Patient Family Health Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.patient_family_health_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        primary_patient_id UUID,
        primary_patient_phone VARCHAR(50) NOT NULL,
        member_name VARCHAR(255) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        member_phone VARCHAR(50),
        member_age INT,
        monthly_spend_limit NUMERIC(12,2) DEFAULT 5000.00,
        current_month_spent NUMERIC(12,2) DEFAULT 0.00,
        wallet_spending_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Pharmacy B2B Purchase Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.pharmacy_b2b_purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        po_number VARCHAR(100) NOT NULL UNIQUE,
        vendor_name VARCHAR(255) NOT NULL,
        payment_terms VARCHAR(50) DEFAULT 'NET_30',
        total_items_count INT DEFAULT 1,
        total_amount NUMERIC(12,2) NOT NULL,
        gst_input_credit NUMERIC(12,2) NOT NULL,
        expected_gross_margin_pct NUMERIC(5,2) DEFAULT 28.50,
        status VARCHAR(50) DEFAULT 'PO_GENERATED',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Pharmacy RTV Debit Notes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.pharmacy_rtv_debit_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        debit_note_number VARCHAR(100) NOT NULL UNIQUE,
        vendor_name VARCHAR(255) NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        batch_number VARCHAR(100) NOT NULL,
        expiry_date TIMESTAMPTZ NOT NULL,
        days_to_expiry INT NOT NULL,
        quantity INT NOT NULL,
        debit_amount NUMERIC(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'DEBIT_NOTE_DISPATCHED',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Diagnostic Health Packages
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.diagnostic_health_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        package_code VARCHAR(100) NOT NULL UNIQUE,
        package_name VARCHAR(255) NOT NULL,
        parameters_count INT NOT NULL,
        package_mrp NUMERIC(12,2) NOT NULL,
        bundled_test_names JSONB DEFAULT '[]'::jsonb,
        fasting_required BOOLEAN DEFAULT TRUE,
        vials_required JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Corporate TPA Clients
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.corporate_tpa_clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        client_code VARCHAR(100) NOT NULL UNIQUE,
        client_name VARCHAR(255) NOT NULL,
        client_type VARCHAR(50) NOT NULL DEFAULT 'CORPORATE_TPA',
        credit_limit NUMERIC(12,2) NOT NULL,
        outstanding_receivable NUMERIC(12,2) DEFAULT 0.00,
        aging_0_30_days NUMERIC(12,2) DEFAULT 0.00,
        aging_31_60_days NUMERIC(12,2) DEFAULT 0.00,
        aging_61_90_days NUMERIC(12,2) DEFAULT 0.00,
        aging_90_plus_days NUMERIC(12,2) DEFAULT 0.00,
        nhcx_payer_code VARCHAR(100),
        contract_valid_until TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. SaaS Communication Wallets
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.saas_communication_wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL UNIQUE,
        wallet_balance NUMERIC(12,2) DEFAULT 2500.00,
        sms_rate NUMERIC(5,2) DEFAULT 0.20,
        whatsapp_rate NUMERIC(5,2) DEFAULT 0.75,
        total_sms_sent INT DEFAULT 1240,
        total_whatsapp_sent INT DEFAULT 3410,
        auto_recharge_threshold NUMERIC(12,2) DEFAULT 500.00,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. SaaS Marketplace Add-ons
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinical.saas_marketplace_addons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        addon_code VARCHAR(100) NOT NULL,
        addon_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        monthly_fee NUMERIC(12,2) NOT NULL,
        is_enabled BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, addon_code)
      );
    `);

    // SEED RECORDS

    // 1. Seed Doctor Volume Payout Tiers
    await client.query(`
      INSERT INTO clinical.doctor_volume_payout_tiers
        (tenant_id, doctor_name, tier_label, min_consultations, max_consultations, doctor_split_pct, clinic_margin_pct)
      VALUES
        ('${TENANT_ID}', 'Dr. Vivek Sharma (MS Gen Surg)', 'Tier 1 (Base OPD)', 1, 50, 60.00, 40.00),
        ('${TENANT_ID}', 'Dr. Vivek Sharma (MS Gen Surg)', 'Tier 2 (Volume Incentive)', 51, 100, 70.00, 30.00),
        ('${TENANT_ID}', 'Dr. Vivek Sharma (MS Gen Surg)', 'Tier 3 (Super Performer)', 101, 9999, 75.00, 25.00)
      ON CONFLICT DO NOTHING;
    `);

    // 2. Seed Family Health Members
    await client.query(`
      INSERT INTO clinical.patient_family_health_members
        (tenant_id, primary_patient_phone, member_name, relationship, member_phone, member_age, monthly_spend_limit, current_month_spent, wallet_spending_enabled)
      VALUES
        ('${TENANT_ID}', '+91 98118 77665', 'Sunita Aggarwal', 'SPOUSE', '+91 98118 77666', 48, 5000.00, 1200.00, true),
        ('${TENANT_ID}', '+91 98118 77665', 'Rohan Aggarwal', 'SON', '+91 98118 77667', 19, 3000.00, 450.00, true),
        ('${TENANT_ID}', '+91 98118 77665', 'Ram Swaroop Aggarwal', 'FATHER', '+91 98118 77668', 76, 10000.00, 3400.00, true)
      ON CONFLICT DO NOTHING;
    `);

    // 3. Seed Pharmacy B2B POs
    await client.query(`
      INSERT INTO clinical.pharmacy_b2b_purchase_orders
        (tenant_id, po_number, vendor_name, payment_terms, total_items_count, total_amount, gst_input_credit, expected_gross_margin_pct, status)
      VALUES
        ('${TENANT_ID}', 'PO-B2B-2026-001', 'Cipla Prime Distributors Ltd', 'NET_30', 24, 185000.00, 22200.00, 28.50, 'GOODS_RECEIVED_VERIFIED'),
        ('${TENANT_ID}', 'PO-B2B-2026-002', 'Sun Pharma Wholesale Depot', 'NET_60', 18, 142000.00, 17040.00, 31.00, 'PO_GENERATED')
      ON CONFLICT (po_number) DO NOTHING;
    `);

    // 4. Seed RTV Debit Notes
    await client.query(`
      INSERT INTO clinical.pharmacy_rtv_debit_notes
        (tenant_id, debit_note_number, vendor_name, medication_name, batch_number, expiry_date, days_to_expiry, quantity, debit_amount, status)
      VALUES
        ('${TENANT_ID}', 'RTV-DN-2026-881', 'Mankind Pharma Wholesalers', 'Moxikind-CV 625', 'MK-2024-88', NOW() + INTERVAL '45 days', 45, 120, 18400.00, 'DEBIT_NOTE_DISPATCHED'),
        ('${TENANT_ID}', 'RTV-DN-2026-882', 'Alkem Laboratories Depot', 'Azee 500mg', 'AK-9921-A', NOW() + INTERVAL '28 days', 28, 80, 11200.00, 'CREDIT_SWAP_RECEIVED')
      ON CONFLICT (debit_note_number) DO NOTHING;
    `);

    // 5. Seed Diagnostic Health Packages
    await client.query(`
      INSERT INTO clinical.diagnostic_health_packages
        (tenant_id, package_code, package_name, parameters_count, package_mrp, bundled_test_names, fasting_required, vials_required, is_active)
      VALUES
        ('${TENANT_ID}', 'PKG-MHC-64', 'DocSearch Master Health Checkup (Comprehensive 64 Parameters)', 64, 1999.00, 
         '["CBC (24 Parameters)", "Lipid Profile (8 Parameters)", "Liver Function Test (11 Parameters)", "Kidney Function Test (9 Parameters)", "HbA1c", "Thyroid Profile (T3, T4, TSH)", "Vitamin D3", "Vitamin B12", "Urine Routine (10 Parameters)"]'::jsonb, 
         true, 
         '["LAVENDER_EDTA", "GOLD_SST_SERUM", "GREY_FLUORIDE", "URINE_CONTAINER"]'::jsonb, 
         true),
        ('${TENANT_ID}', 'PKG-CARDIO-32', 'Executive Cardiac Risk Health Screen', 32, 1499.00, 
         '["Lipid Profile Extended", "hs-CRP Cardiac Marker", "Apolipoprotein A1 & B", "HbA1c", "Homocysteine", "Electrolytes Na/K/Cl"]'::jsonb, 
         true, 
         '["GOLD_SST_SERUM", "LAVENDER_EDTA"]'::jsonb, 
         true)
      ON CONFLICT (package_code) DO NOTHING;
    `);

    // 6. Seed Corporate TPA Clients
    await client.query(`
      INSERT INTO clinical.corporate_tpa_clients
        (tenant_id, client_code, client_name, client_type, credit_limit, outstanding_receivable, aging_0_30_days, aging_31_60_days, aging_61_90_days, aging_90_plus_days, nhcx_payer_code, contract_valid_until)
      VALUES
        ('${TENANT_ID}', 'TPA-STAR-01', 'Star Health & Allied Insurance Co Ltd', 'TPA_INSURER', 5000000.00, 840000.00, 520000.00, 210000.00, 85000.00, 25000.00, 'NHCX-IN-STAR-001', NOW() + INTERVAL '300 days'),
        ('${TENANT_ID}', 'TPA-ICICI-02', 'ICICI Lombard General Insurance', 'TPA_INSURER', 4500000.00, 620000.00, 480000.00, 110000.00, 30000.00, 0.00, 'NHCX-IN-ICICI-002', NOW() + INTERVAL '240 days'),
        ('${TENANT_ID}', 'CORP-TCS-03', 'Tata Consultancy Services (TCS) Corporate Health Desk', 'DIRECT_EMPLOYER', 2000000.00, 185000.00, 185000.00, 0.00, 0.00, 0.00, 'NHCX-EMP-TCS-003', NOW() + INTERVAL '365 days')
      ON CONFLICT (client_code) DO NOTHING;
    `);

    // 7. Seed SaaS Communication Wallet
    await client.query(`
      INSERT INTO clinical.saas_communication_wallets
        (tenant_id, wallet_balance, sms_rate, whatsapp_rate, total_sms_sent, total_whatsapp_sent, auto_recharge_threshold)
      VALUES
        ('${TENANT_ID}', 2500.00, 0.20, 0.75, 1240, 3410, 500.00)
      ON CONFLICT (tenant_id) DO UPDATE 
        SET wallet_balance = 2500.00, total_sms_sent = 1240, total_whatsapp_sent = 3410;
    `);

    // 8. Seed Marketplace Add-ons
    await client.query(`
      INSERT INTO clinical.saas_marketplace_addons
        (tenant_id, addon_code, addon_name, category, monthly_fee, is_enabled, description)
      VALUES
        ('${TENANT_ID}', 'AI_VOICE_SCRIBE', 'Ambient AI Voice-to-Prescription Clinical Scribe', 'AI_CLINICAL', 1499.00, true, 'Listens to patient consultation in regional Indian languages and transcribes SOAP clinical note automatically.'),
        ('${TENANT_ID}', 'WHATSAPP_BOT', 'WhatsApp Interactive Video & Rx Followup Bot', 'PATIENT_ENGAGEMENT', 999.00, true, 'Automated appointment booking, prescription PDF downloads, and post-discharge symptom surveys.'),
        ('${TENANT_ID}', 'NABH_ANALYTICS', 'Advanced NABH 5th Edition Quality & KPI Analytics Suite', 'COMPLIANCE', 2499.00, true, 'Real-time telemetry for HAI device days, medication errors, mortality indicators, and statutory renewals.')
      ON CONFLICT (tenant_id, addon_code) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ All 8 complete commercial hegemony tables created and seeded in PostgreSQL successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
