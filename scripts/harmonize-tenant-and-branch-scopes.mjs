/**
 * Master Harmonizer: Resolve Branch & Tenant ID Scope Mismatch across all clinical tables
 * Canonical Target:
 *   tenant_id: '11111111-1111-4111-8111-111111111111' (DocSearch Apollo Multispecialty)
 *   branch_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' (Main Hospital Facility)
 *   partner_id: '00000000-0000-4000-8000-000000000001'
 *   org_id:     '00000000-0000-4000-8000-000000000002'
 */

import pg from 'pg';

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const client = new Client({ connectionString: dbUrl });

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_PARTNER = '00000000-0000-4000-8000-000000000001';
const CANONICAL_ORG = '00000000-0000-4000-8000-000000000002';

async function harmonize() {
  console.log('🚀 Connecting to PostgreSQL at:', dbUrl.replace(/:[^:@]+@/, ':***@'));
  await client.connect();

  try {
    console.log('\n--- 1. Harmonizing clinical.medication_catalog ---');
    const medUp = await client.query(`
      UPDATE clinical.medication_catalog
      SET branch_id = $1
      WHERE tenant_id = $2;
    `, [CANONICAL_BRANCH, CANONICAL_TENANT]);
    console.log(`✔ Updated ${medUp.rowCount} medications to branch ${CANONICAL_BRANCH}`);

    console.log('\n--- 2. Harmonizing Operation Theatre (OT) Suites, Rooms & Schedules ---');
    // Complexes & Rooms
    await client.query(`
      UPDATE clinical.operation_theatre_complexes
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);

    await client.query(`
      UPDATE clinical.operation_theatre_rooms
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);

    await client.query(`
      UPDATE clinical.surgery_requests
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);

    // Query real patients to link to OT schedules
    const patRes = await client.query(`
      SELECT id, first_name, last_name, mrn 
      FROM clinical.patients 
      WHERE tenant_id = $1 
      LIMIT 4;
    `, [CANONICAL_TENANT]);
    const patients = patRes.rows;

    const procedures = [
      'Emergency Laparoscopic Appendectomy',
      'Total Knee Arthroplasty (TKR)',
      'Laparoscopic Cholecystectomy',
      'Coronary Artery Bypass Graft (CABG)'
    ];

    const surgeons = [
      'Dr. Alok Sharma, MS (General Surgery)',
      'Dr. Rajesh Sharma, MS, MCh (Ortho)',
      'Dr. Priya Nair, MS (Surgical Gastro)',
      'Dr. Vikram Singhal, MS, MCh (CTVS)'
    ];

    const anaesthetists = [
      'Dr. Sunita Rao, MD (Anaesthesiology)',
      'Dr. Deepak Verma, MD, DA',
      'Dr. Amit Joshi, MD, DNB (Critical Care)',
      'Dr. Neha Malhotra, MD (Cardiac Anaesthesia)'
    ];

    const otSchedRes = await client.query(`SELECT id FROM clinical.ot_schedules ORDER BY id`);
    for (let i = 0; i < otSchedRes.rows.length; i++) {
      const row = otSchedRes.rows[i];
      const p = patients[i % patients.length];
      await client.query(`
        UPDATE clinical.ot_schedules
        SET tenant_id = $1,
            branch_id = $2,
            partner_id = $3,
            organization_id = $4,
            patient_id = $5,
            patient_name = $6,
            patient_mrn = $7,
            procedure_name = $8,
            primary_surgeon_name = $9,
            lead_anaesthetist_name = $10,
            status = 'CONFIRMED'
        WHERE id = $11;
      `, [
        CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG,
        p.id, `${p.first_name} ${p.last_name || ''}`.trim(), p.mrn,
        procedures[i % procedures.length],
        surgeons[i % surgeons.length],
        anaesthetists[i % anaesthetists.length],
        row.id
      ]);
    }
    console.log(`✔ Harmonized ${otSchedRes.rows.length} OT schedules with real patients and surgeons.`);

    console.log('\n--- 3. Harmonizing Blood Bank Components, Donors & Donations ---');
    const compUp = await client.query(`
      UPDATE clinical.blood_components
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);
    console.log(`✔ Harmonized ${compUp.rowCount} blood components.`);

    await client.query(`
      UPDATE clinical.blood_donors
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);

    await client.query(`
      UPDATE clinical.blood_donations
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);

    console.log('\n--- 4. Harmonizing Radiology Orders & Appointments ---');
    const radUp = await client.query(`
      UPDATE clinical.radiology_orders
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);
    console.log(`✔ Harmonized ${radUp.rowCount} radiology orders.`);

    await client.query(`
      UPDATE clinical.radiology_appointments
      SET tenant_id = $1, branch_id = $2, partner_id = $3, organization_id = $4;
    `, [CANONICAL_TENANT, CANONICAL_BRANCH, CANONICAL_PARTNER, CANONICAL_ORG]);

    console.log('\n============================================================');
    console.log('✅ SCOPE & TENANT HARMONIZATION COMPLETE 100%');
    console.log('============================================================');
  } catch (err) {
    console.error('❌ Harmonization failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

harmonize();
