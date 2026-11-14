/**
 * Master Seeder: Live Transactional Pharmacy & Cashier Data
 * Targets: clinical.pharmacy_prescriptions, clinical.pharmacy_dispensing,
 *          clinical.billing_cashier_sessions, clinical.billing_service_catalog
 */

import pg from 'pg';

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const client = new Client({ connectionString: dbUrl });

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const PARTNER_ID = '00000000-0000-4000-8000-000000000001';
const ORG_ID = '00000000-0000-4000-8000-000000000002';
const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DOCTOR_ID = 'dddd4444-8492-4ddd-8ddd-849208492004';
const CASHIER_ID = 'ffff4444-8492-4fff-8fff-849208492004';

async function seed() {
  console.log('🚀 Connecting to PostgreSQL at:', dbUrl.replace(/:[^:@]+@/, ':***@'));
  await client.connect();

  try {
    console.log('\n--- 1. Querying Real Patients, Encounters & Medications ---');
    const patientsRes = await client.query('SELECT id, first_name, last_name, mrn FROM clinical.patients LIMIT 20');
    const patients = patientsRes.rows;
    console.log(`Found ${patients.length} patients.`);

    const medsRes = await client.query('SELECT id, generic_name, brand_name, strength, dosage_form, metadata FROM clinical.medication_catalog LIMIT 25');
    const medications = medsRes.rows;
    console.log(`Found ${medications.length} catalog medications.`);

    const encRes = await client.query('SELECT id, patient_id FROM clinical.encounters');
    const encMap = new Map();
    for (const row of encRes.rows) {
      encMap.set(row.patient_id, row.id);
    }

    const docRes = await client.query('SELECT id FROM clinical.doctor_profiles LIMIT 1');
    const doctorId = docRes.rows.length > 0 ? docRes.rows[0].id : DOCTOR_ID;
    console.log(`Using doctor_id: ${doctorId}`);

    const userRes = await client.query("SELECT id FROM core.users LIMIT 1");
    const cashierId = userRes.rows.length > 0 ? userRes.rows[0].id : CASHIER_ID;
    console.log(`Using cashier_id: ${cashierId}`);

    const deptRes = await client.query('SELECT id FROM clinical.operational_departments LIMIT 1');
    const defaultDeptId = deptRes.rows.length > 0 ? deptRes.rows[0].id : '00000000-0000-0000-0000-000000000001';

    if (patients.length === 0 || medications.length === 0) {
      throw new Error('Pre-requisite patients or medications missing.');
    }

    console.log('\n--- 2. Seeding clinical.pharmacy_prescriptions & Items ---');
    // Clear previous seeded items for clean idempotency
    await client.query(`DELETE FROM clinical.pharmacy_dispensing_items WHERE tenant_id = $1`, [TENANT_ID]);
    await client.query(`DELETE FROM clinical.pharmacy_dispensing WHERE tenant_id = $1`, [TENANT_ID]);
    await client.query(`DELETE FROM clinical.pharmacy_prescription_items WHERE tenant_id = $1`, [TENANT_ID]);
    await client.query(`DELETE FROM clinical.pharmacy_prescriptions WHERE tenant_id = $1`, [TENANT_ID]);

    const dispensedRxList = [];

    for (let i = 0; i < Math.min(15, patients.length); i++) {
      const pat = patients[i];
      let encId = encMap.get(pat.id);

      if (!encId) {
        // Create an active OPD consultation encounter for this patient
        const newEnc = await client.query(`
          INSERT INTO clinical.encounters (
            id, tenant_id, partner_id, organization_id, branch_id, department_id,
            patient_id, doctor_id, encounter_number, encounter_type, status,
            consultation_mode, chief_complaint, registered_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            $6, $7, $8, 'OPD', 'COMPLETED',
            'PHYSICAL', 'Follow-up for chronic condition & prescription renewal',
            NOW() - INTERVAL '${i * 4} hours'
          ) RETURNING id;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, defaultDeptId,
          pat.id, doctorId, `ENC-2026-OPD-${String(i + 1).padStart(4, '0')}`
        ]);
        encId = newEnc.rows[0].id;
        encMap.set(pat.id, encId);
      }

      const rxNum = `RX-2026-${String(i + 1).padStart(4, '0')}`;
      const status = i < 5 ? 'DISPENSED' : (i < 10 ? 'PENDING' : 'ACTIVE');

      const rxInsert = await client.query(`
        INSERT INTO clinical.pharmacy_prescriptions (
          id, tenant_id, partner_id, organization_id, branch_id,
          prescription_number, patient_id, encounter_id, prescribing_doctor_id,
          priority, status, prescription_type, prescribed_at, notes, metadata
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, 'OPD', NOW() - INTERVAL '${i * 4} hours',
          $11, $12
        )
        RETURNING id;
      `, [
        TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
        rxNum, pat.id, encId, doctorId,
        i === 1 ? 'STAT' : 'ROUTINE', status,
        `E-Prescription issued for ${pat.first_name} ${pat.last_name || ''} (${pat.mrn})`,
        JSON.stringify({ janAushadhiRecommended: true, emrEncounterRef: `ENC-2026-00${i + 1}` })
      ]);

      const rxId = rxInsert.rows[0].id;
      const createdItemIds = [];

      // Seed 2 prescription items per prescription
      const med1 = medications[i % medications.length];
      const med2 = medications[(i + 1) % medications.length];

      for (const med of [med1, med2]) {
        const isDisp = status === 'DISPENSED';
        const itemRes = await client.query(`
          INSERT INTO clinical.pharmacy_prescription_items (
            id, tenant_id, prescription_id, medication_id,
            prescribed_quantity, unit, dosage, frequency,
            route, duration, duration_unit, substitution_allowed,
            fulfillment_status, dispensed_quantity, remaining_quantity,
            instructions, metadata
          ) VALUES (
            gen_random_uuid(), $1, $2, $3,
            10, 'TABLET', '1 Tab OD', 'ONCE_DAILY',
            'ORAL', 10, 'DAYS', true,
            $4, $5, $6,
            'Take with water after meals', $7
          ) RETURNING id, medication_id
        `, [
          TENANT_ID, rxId, med.id,
          isDisp ? 'FULFILLED' : 'PENDING',
          isDisp ? 10 : 0,
          isDisp ? 0 : 10,
          JSON.stringify({ brand: med.brand_name, generic: med.generic_name })
        ]);
        createdItemIds.push({ id: itemRes.rows[0].id, medicationId: med.id });
      }

      if (i < 5) {
        dispensedRxList.push({
          rxId,
          patientId: pat.id,
          items: createdItemIds
        });
      }
    }
    console.log('✔ Seeded 15 pharmacy prescriptions and 30 prescription items.');

    console.log('\n--- 3. Seeding clinical.pharmacy_dispensing & Items ---');
    for (let i = 0; i < dispensedRxList.length; i++) {
      const target = dispensedRxList[i];
      const dispNum = `DSP-2026-${String(i + 1).padStart(4, '0')}`;

      // Ensure a batch exists for the medication
      const primaryItem = target.items[0];
      let batchId;
      const batchCheck = await client.query('SELECT id FROM clinical.pharmacy_batches WHERE medication_id = $1 LIMIT 1', [primaryItem.medicationId]);
      if (batchCheck.rows.length > 0) {
        batchId = batchCheck.rows[0].id;
      } else {
        const batchInsert = await client.query(`
          INSERT INTO clinical.pharmacy_batches (
            id, tenant_id, partner_id, organization_id, branch_id,
            medication_id, batch_number, manufacturer,
            manufacturing_date, expiry_date,
            received_quantity, available_quantity, unit_cost, status
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, 'Cipla Healthcare Ltd',
            NOW() - INTERVAL '3 months', NOW() + INTERVAL '18 months',
            500, 480, 18.50, 'ACTIVE'
          ) RETURNING id;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          primaryItem.medicationId, `BAT-2026-CIP-${String(i + 1).padStart(3, '0')}`
        ]);
        batchId = batchInsert.rows[0].id;
      }

      const dispInsert = await client.query(`
        INSERT INTO clinical.pharmacy_dispensing (
          id, tenant_id, partner_id, organization_id, branch_id,
          dispensing_number, prescription_id, patient_id, pharmacist_id, pharmacist_name,
          dispensing_status, dispensing_mode, counseling_provided, counseling_notes,
          dispensed_at, metadata
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, $7, 'PHARM-SUNIL-01', 'Sunil Kumar, B.Pharm',
          'COMPLETED', 'COUNTER', true, 'Patient instructed on meal timing and hydration.',
          NOW() - INTERVAL '${i * 2} hours', $8
        )
        RETURNING id;
      `, [
        TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
        dispNum, target.rxId, target.patientId,
        JSON.stringify({ gstInvoice: `INV-PHARM-2026-00${i + 1}`, paymentMode: 'UPI_QR' })
      ]);

      if (dispInsert.rows.length > 0) {
        const dispId = dispInsert.rows[0].id;
        await client.query(`
          INSERT INTO clinical.pharmacy_dispensing_items (
            id, tenant_id, dispensing_id, prescription_item_id, medication_id, batch_id,
            quantity, unit, dosage_instructions, is_substituted, pharmacist_notes
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            10, 'TABLET', '1 Tab OD after food', true, 'Substituted with PMBJP Jan Aushadhi Generic'
          )
        `, [TENANT_ID, dispId, primaryItem.id, primaryItem.medicationId, batchId]);
      }
    }
    console.log('✔ Seeded 5 pharmacy dispensing batches.');

    console.log('\n--- 4. Seeding clinical.billing_cashier_sessions ---');
    await client.query(`DELETE FROM clinical.billing_cashier_sessions WHERE tenant_id = $1`, [TENANT_ID]);
    await client.query(`
      INSERT INTO clinical.billing_cashier_sessions (
        id, tenant_id, partner_id, organization_id, branch_id,
        cashier_id, cashier_name, session_number, opening_balance,
        cash_received, cash_refunded, expected_closing_balance,
        status, opened_at, notes, metadata
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        $5, 'Amit Verma (Reception Front Desk Cashier)', 'CSH-2026-001', 5000.00,
        14500.00, 0.00, 19500.00,
        'OPEN', NOW() - INTERVAL '6 hours',
        'Morning OPD Shift Cashier Session. Verified float cash balance.',
        $6
      );
    `, [
      TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
      cashierId,
      JSON.stringify({ upiCollections: 28500.00, cardCollections: 12000.00, totalGross: 55000.00 })
    ]);
    console.log('✔ Seeded active cashier shift CSH-2026-001.');

    console.log('\n--- 5. Seeding clinical.billing_service_catalog ---');
    const hospitalTariffs = [
      { code: 'CONS-OPD-GEN', name: 'General OPD Consultation', cat: 'CONSULTATION', dept: 'GENERAL_MEDICINE', price: 500.00 },
      { code: 'CONS-OPD-SPEC', name: 'Specialist / Senior Consultant OPD', cat: 'CONSULTATION', dept: 'CARDIOLOGY', price: 800.00 },
      { code: 'EMRG-TRIAGE', name: 'Emergency Trauma Triage & Resuscitation', cat: 'EMERGENCY', dept: 'EMERGENCY', price: 1500.00 },
      { code: 'BED-ICU-DAY', name: 'Intensive Care Unit (ICU) Bed Per Diem', cat: 'BED_CHARGES', dept: 'CRITICAL_CARE', price: 8500.00 },
      { code: 'BED-GEN-DAY', name: 'General Multi-Bed Ward Daycare / IPD', cat: 'BED_CHARGES', dept: 'INPATIENT', price: 1200.00 },
      { code: 'LAB-CBC-AUTO', name: 'Complete Blood Count (CBC) Automated 5-Part', cat: 'LABORATORY', dept: 'PATHOLOGY', price: 350.00 },
      { code: 'LAB-LFT-COMP', name: 'Comprehensive Liver Function Profile (LFT)', cat: 'LABORATORY', dept: 'BIOCHEMISTRY', price: 650.00 },
      { code: 'LAB-KFT-ELEC', name: 'Kidney Function Test & Serum Electrolytes', cat: 'LABORATORY', dept: 'BIOCHEMISTRY', price: 550.00 },
      { code: 'RAD-CXR-PA', name: 'Chest X-Ray PA View Digital Radiography', cat: 'RADIOLOGY', dept: 'RADIOLOGY', price: 450.00 },
      { code: 'RAD-USG-ABD', name: 'USG Whole Abdomen & Pelvis with Color Doppler', cat: 'RADIOLOGY', dept: 'ULTRASOUND', price: 1200.00 },
      { code: 'NURS-MONITOR', name: 'Continuous Multi-Para Cardiac Monitoring / Shift', cat: 'NURSING', dept: 'CRITICAL_CARE', price: 800.00 }
    ];

    for (const t of hospitalTariffs) {
      // Check if service code already exists
      const existing = await client.query('SELECT id FROM clinical.billing_service_catalog WHERE service_code = $1', [t.code]);
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO clinical.billing_service_catalog (
            id, tenant_id, partner_id, organization_id, branch_id,
            service_code, service_name, description, category, department,
            service_type, unit, base_price, taxable, active, effective_from
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            'PROCEDURE', 'PER_SERVICE', $10, false, true, NOW()
          )
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          t.code, t.name, `Standard NABH accredited tariff for ${t.name}`,
          t.cat, t.dept, t.price
        ]);
      } else {
        await client.query(`
          UPDATE clinical.billing_service_catalog
          SET base_price = $2, active = true, updated_at = NOW()
          WHERE service_code = $1
        `, [t.code, t.price]);
      }
    }
    console.log(`✔ Seeded ${hospitalTariffs.length} standard hospital tariff services into billing_service_catalog.`);

    console.log('\n============================================================');
    console.log('✅ LIVE PHARMACY & CASHIER SEEDING COMPLETED 100%');
    console.log('============================================================\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    await client.end();
  }
}

seed();
