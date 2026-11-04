import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('[*] Connected to PostgreSQL 18.4. Executing Competitor-Killer tables migration...');

  // 1. NHCX Claim Transactions
  await client.query(`
    CREATE TABLE IF NOT EXISTS nhcx_claim_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      patient_uhid VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      ipd_admission_id VARCHAR(100),
      payer_name VARCHAR(255) NOT NULL,
      tpa_name VARCHAR(255),
      policy_number VARCHAR(100) NOT NULL,
      claim_type VARCHAR(50) NOT NULL DEFAULT 'PRE_AUTH',
      requested_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      approved_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      nhcx_transaction_ref VARCHAR(150) UNIQUE,
      fhir_claim_bundle_id VARCHAR(150),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      adjudication_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_nhcx_claims_tenant ON nhcx_claim_transactions (tenant_id);
    CREATE INDEX IF NOT EXISTS idx_nhcx_claims_status ON nhcx_claim_transactions (status);
  `);
  console.log('  ✔ Table: nhcx_claim_transactions ready');

  // 2. Jan Aushadhi & Generic Arbitrage Formulary
  await client.query(`
    CREATE TABLE IF NOT EXISTS jan_aushadhi_catalog (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      branded_name VARCHAR(255) NOT NULL,
      generic_molecule VARCHAR(255) NOT NULL,
      dosage_form VARCHAR(50) NOT NULL,
      strength VARCHAR(100) NOT NULL,
      brand_mrp NUMERIC(10, 2) NOT NULL,
      jan_aushadhi_price NUMERIC(10, 2) NOT NULL,
      savings_pct NUMERIC(5, 2) NOT NULL,
      manufacturer_generic VARCHAR(255) DEFAULT 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
      is_cdsco_approved BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_jan_aushadhi_molecule ON jan_aushadhi_catalog (generic_molecule);
    CREATE INDEX IF NOT EXISTS idx_jan_aushadhi_branded ON jan_aushadhi_catalog (branded_name);
  `);
  console.log('  ✔ Table: jan_aushadhi_catalog ready');

  // 3. Chamber Yield Standby Tokens
  await client.query(`
    CREATE TABLE IF NOT EXISTS chamber_yield_standby_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      doctor_id VARCHAR(100) NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      chamber_number VARCHAR(50) NOT NULL,
      slot_time VARCHAR(50) NOT NULL,
      standby_token_number VARCHAR(50) NOT NULL,
      patient_phone VARCHAR(50) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      offer_status VARCHAR(50) NOT NULL DEFAULT 'OFFERED',
      estimated_delay_minutes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_chamber_yield_tenant ON chamber_yield_standby_queue (tenant_id, doctor_id);
  `);
  console.log('  ✔ Table: chamber_yield_standby_queue ready');

  // 4. Transparent Elective Surgery Packages
  await client.query(`
    CREATE TABLE IF NOT EXISTS transparent_surgery_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      specialty VARCHAR(100) NOT NULL,
      pre_op_estimate NUMERIC(10, 2) NOT NULL DEFAULT 0,
      ot_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
      implant_estimate NUMERIC(10, 2) NOT NULL DEFAULT 0,
      bed_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
      post_op_care NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total_package_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
      zero_emi_tenures VARCHAR(50) NOT NULL DEFAULT '3,6,12',
      monthly_emi_starting_from NUMERIC(10, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_surgery_packages_code ON transparent_surgery_packages (code);
  `);
  console.log('  ✔ Table: transparent_surgery_packages ready');

  // Seed Initial Top Formulations in Jan Aushadhi Catalog if empty
  const countRes = await client.query('SELECT COUNT(*) FROM jan_aushadhi_catalog');
  if (parseInt(countRes.rows[0].count) === 0) {
    const formulations = [
      ['Augmentin 625 Duo', 'Amoxicillin + Clavulanic Acid', 'Tablet', '500mg + 125mg', 223.50, 65.00, 70.92],
      ['Pantocid DSR', 'Pantoprazole + Domperidone', 'Capsule', '40mg + 30mg', 189.00, 48.00, 74.60],
      ['Pan 40', 'Pantoprazole', 'Tablet', '40mg', 155.00, 22.00, 85.81],
      ['Azithral 500', 'Azithromycin', 'Tablet', '500mg', 132.00, 39.50, 70.08],
      ['Monocef 1g', 'Ceftriaxone Sodium Injection', 'Injection', '1g Vial', 68.00, 28.50, 58.09],
      ['Telma 40', 'Telmisartan', 'Tablet', '40mg', 128.00, 24.00, 81.25],
      ['Glycomet GP 1', 'Metformin + Glimepiride', 'Tablet', '500mg + 1mg', 115.00, 28.00, 75.65],
      ['Atorva 10', 'Atorvastatin', 'Tablet', '10mg', 110.00, 20.00, 81.82],
      ['Dolo 650', 'Paracetamol', 'Tablet', '650mg', 34.00, 11.50, 66.18],
      ['Montair LC', 'Montelukast + Levocetirizine', 'Tablet', '10mg + 5mg', 215.00, 45.00, 79.07],
      ['Clavam 625', 'Amoxicillin + Clavulanate', 'Tablet', '625mg', 220.00, 65.00, 70.45],
      ['Shelcal 500', 'Calcium + Vitamin D3', 'Tablet', '500mg + 250IU', 145.00, 38.00, 73.79],
      ['Meronem 1g', 'Meropenem IV', 'Injection', '1000mg', 3200.00, 850.00, 73.44],
      ['Clexane 40mg', 'Enoxaparin Sodium', 'Pre-filled Syringe', '0.4ml', 620.00, 260.00, 58.06],
      ['Combiflam', 'Ibuprofen + Paracetamol', 'Tablet', '400mg + 325mg', 52.00, 16.00, 69.23]
    ];

    for (const [brand, generic, form, strength, mrp, jaPrice, savings] of formulations) {
      await client.query(`
        INSERT INTO jan_aushadhi_catalog (branded_name, generic_molecule, dosage_form, strength, brand_mrp, jan_aushadhi_price, savings_pct)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [brand, generic, form, strength, mrp, jaPrice, savings]);
    }
    console.log(`  ✔ Seeded ${formulations.length} PMBJP generic formulations`);
  }

  // Seed Surgery Packages
  const pkgCount = await client.query('SELECT COUNT(*) FROM transparent_surgery_packages');
  if (parseInt(pkgCount.rows[0].count) === 0) {
    const packages = [
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'PKG-LAP-CHOLE', 'Laparoscopic Cholecystectomy (Gallbladder)', 'General / GI Surgery', 4500, 28000, 12000, 14000, 6500, 65000, '3,6,12', 5417],
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'PKG-ING-HERNIA', 'Laparoscopic Inguinal Hernia (with 3D Mesh)', 'General Surgery', 4000, 24000, 10000, 12000, 5000, 55000, '3,6,12', 4583],
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'PKG-CATARACT-PHACO', 'Phacoemulsification Cataract with Foldable Hydrophobic IOL', 'Ophthalmology', 2500, 16000, 11000, 4500, 4000, 38000, '3,6,12', 3167],
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'PKG-LSCS-DELIVERY', 'Cesarean Delivery (LSCS Mother & Baby Joy Package)', 'Obstetrics & Gynecology', 5000, 29000, 0, 18000, 8000, 60000, '3,6,12', 5000],
      ['6855be07-5298-4148-a571-c51ac49ac7f3', 'PKG-TKR-UNILATERAL', 'Total Knee Replacement (Unilateral High-Flex Cobalt Chromium)', 'Orthopedics', 8000, 48000, 65000, 24000, 10000, 155000, '6,12,24', 6458]
    ];

    for (const [tenantId, code, name, spec, preOp, ot, implant, bed, postOp, total, tenures, emi] of packages) {
      await client.query(`
        INSERT INTO transparent_surgery_packages (tenant_id, code, name, specialty, pre_op_estimate, ot_charges, implant_estimate, bed_charges, post_op_care, total_package_cost, zero_emi_tenures, monthly_emi_starting_from)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [tenantId, code, name, spec, preOp, ot, implant, bed, postOp, total, tenures, emi]);
    }
    console.log(`  ✔ Seeded ${packages.length} transparent elective surgery packages`);
  }

  await client.end();
  console.log('[✔] Competitor-Killer tables migration complete!\n');
}

migrate().catch((err) => {
  console.error('[!] Migration failed:', err);
  process.exit(1);
});
