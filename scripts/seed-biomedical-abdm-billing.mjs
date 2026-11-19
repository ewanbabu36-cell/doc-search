/**
 * Master Clinical & Operations Seeder
 * Populates 0-row tables:
 *  - clinical.biomedical_assets
 *  - clinical.biomedical_ppm_schedules
 *  - clinical.biomedical_calibration_records
 *  - clinical.abdm_consent_artefacts
 *  - clinical.billing_advances
 *  - clinical.billing_packages
 */

import pg from 'pg';
import crypto from 'crypto';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_PARTNER = '00000000-0000-4000-8000-000000000001';
const CANONICAL_ORG = '00000000-0000-4000-8000-000000000002';

const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

console.log('🚀 Seeding Biomedical Assets, ABDM Consents, and Billing Advances & Packages...');

try {
  await client.query('BEGIN');

  // 1. SEED BIOMEDICAL ASSETS
  console.log('1. Seeding clinical.biomedical_assets...');
  const assetRows = [
    {
      id: crypto.randomUUID(),
      code: 'BIO-ICU-VENT-01',
      name: 'Dräger Evita V800 ICU Ventilator',
      model: 'Evita V800 Advanced',
      serial: 'DRA-EV-884102',
      manufacturer: 'Dräger Medical Systems',
      category: 'VENTILATOR',
      criticality: 'CRITICAL_LIFE_SUPPORT',
      status: 'IN_SERVICE',
      department: 'Intensive Care Unit (ICU)',
      location: 'ICU Bed 04 (Level 3 HDU)',
      purchaseCost: 2850000,
      currentValue: 2400000,
      ppmFreq: 'QUARTERLY',
      vendor: 'Dräger India Pvt Ltd'
    },
    {
      id: crypto.randomUUID(),
      code: 'BIO-ER-DEFIB-01',
      name: 'Philips HeartStart XL+ Defibrillator',
      model: 'HeartStart XL+ Bifásico',
      serial: 'PHI-HS-992144',
      manufacturer: 'Philips Healthcare',
      category: 'DEFIBRILLATOR',
      criticality: 'CRITICAL_LIFE_SUPPORT',
      status: 'IN_SERVICE',
      department: 'Emergency & Trauma (ER)',
      location: 'ER Resuscitation Bay Crash Cart 1',
      purchaseCost: 850000,
      currentValue: 720000,
      ppmFreq: 'BIANNUAL',
      vendor: 'Philips Healthcare Services'
    },
    {
      id: crypto.randomUUID(),
      code: 'BIO-CCU-MON-02',
      name: 'Mindray ePM 12M Patient Monitor',
      model: 'ePM 12M Multi-Gas',
      serial: 'MIN-EPM-772189',
      manufacturer: 'Mindray Bio-Medical',
      category: 'PATIENT_MONITOR',
      criticality: 'MODERATE_MONITORING',
      status: 'IN_SERVICE',
      department: 'Cardiac Care Unit (CCU)',
      location: 'CCU Bed 02',
      purchaseCost: 450000,
      currentValue: 380000,
      ppmFreq: 'BIANNUAL',
      vendor: 'Mindray Medical India'
    },
    {
      id: crypto.randomUUID(),
      code: 'BIO-NICU-PUMP-01',
      name: 'B. Braun Perfusor Space Infusion Pump',
      model: 'Space Syringe Module',
      serial: 'BBR-SP-443190',
      manufacturer: 'B. Braun Melsungen AG',
      category: 'INFUSION_PUMP',
      criticality: 'MODERATE_MONITORING',
      status: 'IN_SERVICE',
      department: 'Neonatal ICU (NICU)',
      location: 'NICU Incubator 3',
      purchaseCost: 195000,
      currentValue: 165000,
      ppmFreq: 'QUARTERLY',
      vendor: 'B. Braun Medical India'
    },
    {
      id: crypto.randomUUID(),
      code: 'BIO-OT-CARM-01',
      name: 'Siemens Cios Select Mobile C-Arm',
      model: 'Cios Select Fluoroscopy',
      serial: 'SIE-CS-339012',
      manufacturer: 'Siemens Healthineers',
      category: 'SURGICAL_IMAGING',
      criticality: 'HIGH_SURGICAL',
      status: 'IN_SERVICE',
      department: 'Operation Theatre (OT)',
      location: 'OT Room 2 (Orthopedic OT)',
      purchaseCost: 4200000,
      currentValue: 3650000,
      ppmFreq: 'QUARTERLY',
      vendor: 'Siemens Healthineers India'
    },
    {
      id: crypto.randomUUID(),
      code: 'BIO-OT-SAW-01',
      name: 'Stryker System 8 Orthopedic Power Tool',
      model: 'System 8 Rotary & Sagittal Handpiece',
      serial: 'STR-S8-112098',
      manufacturer: 'Stryker Orthopaedics',
      category: 'SURGICAL_TOOL',
      criticality: 'HIGH_SURGICAL',
      status: 'IN_SERVICE',
      department: 'Operation Theatre (OT)',
      location: 'OT Sterile Storage Rack B',
      purchaseCost: 1450000,
      currentValue: 1280000,
      ppmFreq: 'BIANNUAL',
      vendor: 'Stryker India Pvt Ltd'
    }
  ];

  for (const a of assetRows) {
    await client.query(`
      INSERT INTO clinical.biomedical_assets (
        id, tenant_id, partner_id, organization_id, branch_id,
        asset_code, asset_name, model_number, serial_number, manufacturer,
        category, risk_criticality, operational_status, department_name, physical_location,
        installation_date, purchase_date, purchase_cost, current_value, warranty_expiry_date,
        contract_type, contract_vendor_name, contract_expiry_date, ppm_frequency,
        last_ppm_date, next_ppm_due_date, calibration_frequency_months, last_calibration_date,
        next_calibration_due_date, calibration_status, electrical_safety_certified,
        qr_code_identifier, responsible_biomedical_engineer, uptime_percentage, is_active,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        '2026-01-10', '2026-01-05', $16, $17, '2028-01-05',
        'COMPREHENSIVE_AMC', $18, '2028-01-05', $19,
        '2026-10-15', '2027-01-15', 12, '2026-10-15',
        '2027-10-15', 'CALIBRATED_VALID', true,
        $20, 'Er. Rajesh K. Varma (Lead BME)', 99.4, true,
        NOW(), NOW()
      ) ON CONFLICT (tenant_id, asset_code) DO NOTHING;
    `, [
      a.id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      a.code, a.name, a.model, a.serial, a.manufacturer,
      a.category, a.criticality, a.status, a.department, a.location,
      a.purchaseCost, a.currentValue, a.vendor, a.ppmFreq,
      `QR-${a.code}`
    ]);
  }
  console.log(`   ✅ Seeded ${assetRows.length} biomedical assets.`);

  // 2. SEED BIOMEDICAL PPM SCHEDULES
  console.log('2. Seeding clinical.biomedical_ppm_schedules...');
  for (let i = 0; i < assetRows.length; i++) {
    const a = assetRows[i];
    await client.query(`
      INSERT INTO clinical.biomedical_ppm_schedules (
        id, tenant_id, partner_id, organization_id, branch_id,
        schedule_code, asset_id, asset_code, asset_name, department_name,
        frequency, scheduled_due_date, assigned_engineer, tasks_checklist,
        status, servicing_notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, '2026-12-15', 'Er. Rajesh K. Varma', $12,
        'SCHEDULED', 'Quarterly preventive maintenance and circuit leakage inspection', NOW(), NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `, [
      crypto.randomUUID(), CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      `PPM-${a.code}-${Date.now().toString().slice(-4)}`, a.id, a.code, a.name, a.department,
      a.ppmFreq,
      JSON.stringify([
        { task: 'Visual Inspection & Chassis Integrity', passed: true },
        { task: 'Battery Backup & Voltage Regulation Test', passed: true },
        { task: 'Sensor Calibration & Alarm Verification', passed: true },
        { task: 'HEPA / Air Filter Cleaning & Replacement', passed: true }
      ])
    ]);
  }
  console.log(`   ✅ Seeded ${assetRows.length} PPM schedules.`);

  // 3. SEED BIOMEDICAL CALIBRATION RECORDS
  console.log('3. Seeding clinical.biomedical_calibration_records...');
  for (let i = 0; i < 3; i++) {
    const a = assetRows[i];
    await client.query(`
      INSERT INTO clinical.biomedical_calibration_records (
        id, tenant_id, partner_id, organization_id, branch_id,
        certificate_number, asset_id, asset_code, asset_name,
        calibration_date, valid_until_date, calibrated_by_agency, lead_metrologist_name,
        traceable_standards_used, tolerances_observed, status, safety_test_passed,
        remarks, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        '2026-10-15', '2027-10-14', 'NABL Accredited Metrology Labs (Cert #CC-8821)', 'Dr. S. K. Narang (Chief Metrologist)',
        'Fluke ESA620 Electrical Safety Analyzer (S/N: 29019)', 'Flow error < 1.2%, Pressure error < 0.8% (Well within IEC 60601 limits)',
        'VALID', true, 'Asset cleared for high-risk critical ICU utilization.', NOW()
      ) ON CONFLICT (tenant_id, certificate_number) DO NOTHING;
    `, [
      crypto.randomUUID(), CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      `CAL-NABL-2026-00${i+1}`, a.id, a.code, a.name
    ]);
  }
  console.log(`   ✅ Seeded 3 NABL calibration records.`);

  // 4. SEED ABDM CONSENT ARTEFACTS
  console.log('4. Seeding clinical.abdm_consent_artefacts...');
  const abdmConsents = [
    {
      patientName: 'Rameshwar Prasad',
      abha: 'rameshwar.74@abdm',
      purpose: 'CARETREAT',
      desc: 'Care and Treatment under Clinical Specialist'
    },
    {
      patientName: 'Rajesh Kumar',
      abha: 'rajesh.sharma@abdm',
      purpose: 'CARETREAT',
      desc: 'Care and Treatment for Chronic Diabetes & HTN'
    },
    {
      patientName: 'Sunita Devi',
      abha: 'sunita.devi@abdm',
      purpose: 'MEDREM',
      desc: 'Medicine Refill and Tele-consultation Continuity'
    }
  ];

  for (const c of abdmConsents) {
    const consentReqId = `REQ-ABDM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*900)}`;
    const artefactId = `ART-M2-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*900)}`;
    await client.query(`
      INSERT INTO clinical.abdm_consent_artefacts (
        id, tenant_id, partner_id, organization_id, branch_id,
        consent_request_id, artefact_id, patient_abha_address, patient_name,
        requester_hip_hiu, purpose_code, purpose_description, date_from, date_to,
        data_erase_date, status, granted_at, linked_care_context_refs, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        'Apollo Multispecialty Hospital HIP/HIU (IN09100021)', $10, $11, '2026-01-01', '2026-12-31',
        '2027-01-05', 'GRANTED', NOW(), $12, NOW()
      ) ON CONFLICT (id) DO NOTHING;
    `, [
      crypto.randomUUID(), CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      consentReqId, artefactId, c.abha, c.patientName, c.purpose, c.desc,
      JSON.stringify(['OPD-CONSULTATION-2026-01', 'LAB-DIAGNOSTIC-REPORT-2026-04'])
    ]);
  }
  console.log(`   ✅ Seeded ${abdmConsents.length} ABDM consent artefacts.`);

  // 5. SEED BILLING ADVANCES
  console.log('5. Seeding clinical.billing_advances...');
  const patRes = await client.query(`SELECT id, first_name, last_name FROM clinical.patients LIMIT 4`);
  const encRes = await client.query(`SELECT id FROM clinical.encounters LIMIT 4`);
  
  const advances = [
    { amount: 50000, desc: 'IPD Cardiac Surgery Advance Deposit' },
    { amount: 25000, desc: 'Emergency Trauma HDU Admission Advance' },
    { amount: 15000, desc: 'Daycare Laparoscopic Procedure Advance' },
    { amount: 10000, desc: 'ICU Bed Booking Initial Advance Deposit' }
  ];

  for (let i = 0; i < advances.length; i++) {
    const patId = patRes.rows[i]?.id || patRes.rows[0]?.id;
    const encId = encRes.rows[i]?.id || encRes.rows[0]?.id;
    const adv = advances[i];
    await client.query(`
      INSERT INTO clinical.billing_advances (
        id, tenant_id, partner_id, organization_id, branch_id,
        patient_id, encounter_id, advance_number, amount, available_amount,
        status, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $9,
        'ACTIVE', $10, NOW(), NOW()
      ) ON CONFLICT (advance_number) DO NOTHING;
    `, [
      crypto.randomUUID(), CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      patId, encId, `ADV-2026-000${i+1}`, adv.amount,
      JSON.stringify({ description: adv.desc, paymentMode: 'UPI_HDFC_AUTO_RECONCILED' })
    ]);
  }
  console.log(`   ✅ Seeded ${advances.length} billing advances.`);

  // 6. SEED BILLING PACKAGES
  console.log('6. Seeding clinical.billing_packages...');
  const packages = [
    { code: 'PKG-LAP-CHOL', name: 'Laparoscopic Cholecystectomy Comprehensive Package', price: 48000, cat: 'SURGERY', days: 30, desc: '3-port Laparoscopy with OT charges, surgeon fee, and 2-day stay' },
    { code: 'PKG-TKR-UNI', name: 'Total Knee Replacement (Unilateral) Package', price: 145000, cat: 'ORTHOPEDIC', days: 45, desc: 'Zimmer Biomet High-Flex Implant + 4-day private suite stay' },
    { code: 'PKG-MAT-DELIV', name: 'Normal Vaginal Delivery & Newborn Care Package', price: 32000, cat: 'MATERNITY', days: 30, desc: 'Obstetric delivery, pediatrician initial round, vaccination & suite' },
    { code: 'PKG-DEN-DAY', name: 'Dengue Platelet & Fluid Protocol Daycare Package', price: 14500, cat: 'DAYCARE', days: 14, desc: 'Daycare HDU bed, IV fluid electrolyte correction & 4x platelet counts' },
    { code: 'PKG-CAT-SURG', name: 'Phacoemulsification Cataract with Foldable IOL', price: 22000, cat: 'OPHTHALMOLOGY', days: 30, desc: 'Micro-incision Phaco + Alcon Foldable Hydrophobic Acrylic IOL' }
  ];

  for (const pkg of packages) {
    await client.query(`
      INSERT INTO clinical.billing_packages (
        id, tenant_id, partner_id, organization_id, branch_id,
        package_code, package_name, description, category, total_price,
        validity_days, is_active, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, true, $12, NOW(), NOW()
      ) ON CONFLICT (tenant_id, package_code) DO NOTHING;
    `, [
      crypto.randomUUID(), CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      pkg.code, pkg.name, pkg.desc, pkg.cat, pkg.price,
      pkg.days, JSON.stringify({ nabhAccreditedTariff: true, pmjayLinked: true })
    ]);
  }
  console.log(`   ✅ Seeded ${packages.length} billing packages.`);

  await client.query('COMMIT');
  console.log('\n🎉 ALL 6 CRITICAL MODULES SEEDED SUCCESSFULLY!');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('❌ Seeding failed:', err);
  process.exit(1);
} finally {
  await client.end();
}
