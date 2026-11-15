import pg from 'pg';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_ORG = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';
const CANONICAL_PARTNER = '6855be07-5298-4148-a571-c51ac49ac7f3';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch'
});

async function main() {
  await client.connect();
  console.log('=== SEEDING REALISTIC INPATIENT WARD RECORDS ===');

  const admissionsRes = await client.query(`
    SELECT a.id as admission_id, a.patient_id, a.branch_id, a.organization_id, a.partner_id,
           p.first_name, p.last_name, p.uhid
    FROM clinical.inpatient_admissions a
    JOIN clinical.patients p ON a.patient_id = p.id
    WHERE a.tenant_id = $1 AND a.status = 'ADMITTED'
    LIMIT 8;
  `, [CANONICAL_TENANT]);

  const bedsRes = await client.query(`
    SELECT b.id as bed_id, b.ward_id, b.bed_code, w.ward_name
    FROM clinical.inpatient_beds b
    JOIN clinical.inpatient_wards w ON b.ward_id = w.id
    WHERE b.tenant_id = $1
    ORDER BY b.bed_code
    LIMIT 8;
  `, [CANONICAL_TENANT]);

  const admissions = admissionsRes.rows;
  const beds = bedsRes.rows;

  console.log(`Found ${admissions.length} active admissions and ${beds.length} beds.`);

  for (let i = 0; i < admissions.length; i++) {
    const adm = admissions[i];
    const bed = beds[i % beds.length];

    // 1. Bed allocation
    await client.query(`
      INSERT INTO clinical.inpatient_bed_allocations (
        tenant_id, partner_id, organization_id, branch_id,
        admission_id, patient_id, ward_id, bed_id,
        allocated_from, status, allocation_type, allocated_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        NOW() - INTERVAL '2 days', 'OCCUPIED', 'ADMISSION', 'Dr. Arvind Sharma'
      ) ON CONFLICT DO NOTHING;
    `, [
      CANONICAL_TENANT, adm.partner_id || CANONICAL_PARTNER, adm.organization_id || CANONICAL_ORG, adm.branch_id || CANONICAL_BRANCH,
      adm.admission_id, adm.patient_id, bed.ward_id, bed.bed_id
    ]);

    // 2. Doctor Daily Rounds
    await client.query(`
      INSERT INTO clinical.inpatient_doctor_rounds (
        tenant_id, partner_id, organization_id, branch_id,
        admission_id, patient_id, doctor_name, doctor_specialty,
        round_type, subjective_assessment, objective_clinical_findings,
        clinical_impression, treatment_plan_updates, discharge_readiness_score
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, 'Dr. Rajesh Sen', 'General Medicine & Critical Care',
        'MORNING_PRIMARY_ROUND',
        'Patient reports afebrile state with significantly improved breathing overnight.',
        'SpO2: 98% on room air, Pulse: 74 bpm, BP: 124/82 mmHg, Chest clear bilaterally.',
        'Post-infective bronchospasm resolving satisfactorily under nebulization.',
        'Step down IV antibiotics to oral Azithromycin 500mg OD. Ambulate thrice daily.',
        75
      ) ON CONFLICT DO NOTHING;
    `, [
      CANONICAL_TENANT, adm.partner_id || CANONICAL_PARTNER, adm.organization_id || CANONICAL_ORG, adm.branch_id || CANONICAL_BRANCH,
      adm.admission_id, adm.patient_id
    ]);

    // 3. Nursing Notes
    await client.query(`
      INSERT INTO clinical.inpatient_nursing_notes (
        tenant_id, partner_id, organization_id, branch_id,
        admission_id, patient_id, author_name, note_type,
        shift, is_critical_flag, note_content
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, 'Staff Nurse Priya Nair', 'PROGRESS_NOTE',
        'DAY', false,
        'Morning vitals checked and recorded. Oral medications administered on schedule. IV line site healthy without phlebitis. Tolerating diabetic diet well.'
      ) ON CONFLICT DO NOTHING;
    `, [
      CANONICAL_TENANT, adm.partner_id || CANONICAL_PARTNER, adm.organization_id || CANONICAL_ORG, adm.branch_id || CANONICAL_BRANCH,
      adm.admission_id, adm.patient_id
    ]);

    // 4. Care Plan
    await client.query(`
      INSERT INTO clinical.inpatient_care_plans (
        tenant_id, partner_id, organization_id, branch_id,
        admission_id, patient_id, nursing_diagnosis, expected_outcome,
        interventions, target_evaluation_date, status, created_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6,
        'Impaired airway clearance related to post-viral bronchial secretions',
        'Patient maintains SpO2 >= 96% and coughs effectively without wheeze',
        'Chest physiotherapy Q8H, incentive spirometry 10 breaths every waking hour, hydration 2.5L/day',
        NOW() + INTERVAL '24 hours', 'ACTIVE', 'Sister Sarita John'
      ) ON CONFLICT DO NOTHING;
    `, [
      CANONICAL_TENANT, adm.partner_id || CANONICAL_PARTNER, adm.organization_id || CANONICAL_ORG, adm.branch_id || CANONICAL_BRANCH,
      adm.admission_id, adm.patient_id
    ]);

    console.log(`✓ Seeded IPD workflow for admission ${adm.admission_id} (${adm.first_name} ${adm.last_name})`);
  }

  console.log('=== IPD WARD SEEDING COMPLETE ===');
  await client.end();
}

main().catch(console.error);
