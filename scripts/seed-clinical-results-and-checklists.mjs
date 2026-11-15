/**
 * Seeder: Transactional Lab Results, Pathologist Reports, OT Safety Checklists,
 *         Surgical Consents, Transfusion Records, and Supply Chain Warehouses/Transfers.
 */

import pg from 'pg';

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const client = new Client({ connectionString: dbUrl });

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_PARTNER = '00000000-0000-4000-8000-000000000001';
const CANONICAL_ORG = '00000000-0000-4000-8000-000000000002';

async function seed() {
  console.log('🚀 Connecting to PostgreSQL at:', dbUrl.replace(/:[^:@]+@/, ':***@'));
  await client.connect();

  try {
    console.log('\n--- 1. Seeding Lab Investigation Results & Finalized Reports ---');
    // Clear previously seeded for idempotency
    await client.query(`DELETE FROM clinical.investigation_results WHERE tenant_id = $1`, [CANONICAL_TENANT]);
    await client.query(`DELETE FROM clinical.investigation_reports WHERE tenant_id = $1`, [CANONICAL_TENANT]);

    const orderRes = await client.query(`
      SELECT id, patient_id, order_number, clinical_indication, ordered_at 
      FROM clinical.investigation_orders 
      WHERE tenant_id = $1
      ORDER BY ordered_at DESC;
    `, [CANONICAL_TENANT]);

    const labOrders = orderRes.rows;
    console.log(`Found ${labOrders.length} lab orders to seed results for.`);

    const cbcParameters = [
      { code: 'HB', name: 'Hemoglobin (Hb)', val: '14.2', num: 14.2, unit: 'g/dL', ref: '13.0 - 17.0', min: 13.0, max: 17.0 },
      { code: 'TLC', name: 'Total Leukocyte Count (WBC)', val: '7400', num: 7400, unit: '/uL', ref: '4000 - 11000', min: 4000, max: 11000 },
      { code: 'PLT', name: 'Platelet Count', val: '240000', num: 240000, unit: '/uL', ref: '150000 - 450000', min: 150000, max: 450000 },
      { code: 'PCV', name: 'Packed Cell Volume (Hematocrit)', val: '42.5', num: 42.5, unit: '%', ref: '40.0 - 50.0', min: 40.0, max: 50.0 },
      { code: 'RBC', name: 'Red Blood Cell Count', val: '4.8', num: 4.8, unit: 'million/uL', ref: '4.5 - 5.5', min: 4.5, max: 5.5 }
    ];

    let resultCount = 0;
    let reportCount = 0;

    for (let i = 0; i < labOrders.length; i++) {
      const ord = labOrders[i];

      // Seed 5 parameters per order
      for (const p of cbcParameters) {
        await client.query(`
          INSERT INTO clinical.investigation_results (
            id, tenant_id, partner_id, organization_id, order_id,
            parameter_code, parameter_name, result_value, numeric_value,
            unit, reference_range, reference_min, reference_max,
            abnormal_flag, is_critical, result_status, entered_by,
            entered_at, verified_by, verified_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            'NORMAL', false, 'VERIFIED', 'Pathology Lab Tech - Sunita',
            NOW() - INTERVAL '${i * 2} hours', 'Dr. Ramesh Sen, MD (Pathology)', NOW() - INTERVAL '${i * 2} hours'
          );
        `, [
          CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, ord.id,
          p.code, p.name, p.val, p.num,
          p.unit, p.ref, p.min, p.max
        ]);
        resultCount++;
      }

      // Seed finalized report
      const repNum = `REP-2026-${String(i + 1).padStart(4, '0')}`;
      await client.query(`
        INSERT INTO clinical.investigation_reports (
          id, tenant_id, partner_id, organization_id, order_id, patient_id,
          report_number, report_title, clinical_findings, impression,
          recommendations, reporting_clinician, verifying_pathologist,
          report_status, finalized_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          $6, $7,
          'Automated 5-Part Hematology Profile verified on Sysmex XN-1000. Erythrocyte indices within normal adult physiological limits. No immature granulocytes seen.',
          'Normocytic, Normochromic Hematological Picture. Platelets adequate on smear.',
          'Correlate clinically. Repeat CBC after 1 month for chronic monitoring.',
          'Dr. Ramesh Sen, MD (Pathology)', 'Dr. Ramesh Sen, MD - DMC Reg #48921',
          'FINALIZED', NOW() - INTERVAL '${i * 2} hours'
        );
      `, [
        CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, ord.id, ord.patient_id,
        repNum, `Diagnostic Pathology Report: ${ord.clinical_indication || 'Automated Hematology Profile'}`
      ]);
      reportCount++;
    }
    console.log(`✔ Seeded ${resultCount} quantitative investigation results across ${reportCount} finalized lab reports.`);

    console.log('\n--- 2. Seeding OT Surgical Safety Checklists & Consents ---');
    await client.query(`DELETE FROM clinical.surgical_safety_checklists WHERE tenant_id = $1`, [CANONICAL_TENANT]);
    await client.query(`DELETE FROM clinical.surgical_consents WHERE tenant_id = $1`, [CANONICAL_TENANT]);

    const otRes = await client.query(`
      SELECT id, patient_id, patient_name, procedure_name, primary_surgeon_name, surgery_request_id 
      FROM clinical.ot_schedules 
      WHERE tenant_id = $1;
    `, [CANONICAL_TENANT]);

    for (let i = 0; i < otRes.rows.length; i++) {
      const ot = otRes.rows[i];

      // Seed 3 WHO Surgical Safety Stages (SIGN_IN, TIME_OUT, SIGN_OUT)
      const stages = [
        { stage: 'SIGN_IN', by: 'Nurse Anitha Nair, RN', role: 'CIRCULATING_NURSE' },
        { stage: 'TIME_OUT', by: 'Dr. Sunita Rao, MD', role: 'LEAD_ANAESTHETIST' },
        { stage: 'SIGN_OUT', by: 'Nurse Preeti Sharma, RN', role: 'SCRUB_NURSE' }
      ];

      for (const st of stages) {
        await client.query(`
          INSERT INTO clinical.surgical_safety_checklists (
            id, tenant_id, partner_id, organization_id, branch_id,
            schedule_id, patient_id, stage, conducted_by, conducted_role,
            patient_confirmed, site_marking_confirmed, anaesthesia_machine_checked,
            pulse_oximeter_functioning, known_allergy_confirmed, difficult_airway_risk_evaluated,
            blood_loss_risk_evaluated, team_introduced_roles, antibiotic_prophylaxis_given,
            essential_imaging_displayed, sponge_count_correct, needle_count_correct,
            instrument_count_correct, specimen_properly_labeled, equipment_issues_identified,
            recovery_concerns_addressed, timestamp
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            true, true, true,
            true, true, true,
            true, true, true,
            true, true, true,
            true, true, false,
            true, NOW() - INTERVAL '${i * 3} hours'
          );
        `, [
          CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
          ot.id, ot.patient_id, st.stage, st.by, st.role
        ]);
      }

      // Seed Surgical Consent
      const consentNumber = `CNS-2026-${String(i + 1).padStart(4, '0')}`;
      await client.query(`
        INSERT INTO clinical.surgical_consents (
          id, tenant_id, partner_id, organization_id, branch_id,
          surgery_request_id, patient_id, patient_name, consent_number,
          procedure_consent_given, anaesthesia_consent_given, blood_transfusion_consent_given,
          high_risk_consent_given, implant_consent_given, consenting_person_name,
          relationship_to_patient, counselled_by_doctor, witness_name,
          is_signed_digitally, consent_timestamp, status, notes
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, $7, $8,
          true, true, true,
          false, true, $7,
          'SELF', $9, 'Staff Nurse Kavita Verma',
          true, NOW() - INTERVAL '${i * 3} hours', 'VALID_SIGNED',
          'Patient informed of procedure benefits, risks, and intraoperative contingencies. Verbal and digital consent confirmed.'
        );
      `, [
        CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
        ot.surgery_request_id, ot.patient_id, ot.patient_name, consentNumber,
        ot.primary_surgeon_name
      ]);
    }
    console.log(`✔ Seeded WHO Surgical Safety Checklists (12 stages) and Valid Informed Consents for ${otRes.rows.length} surgeries.`);

    console.log('\n--- 3. Seeding Blood Transfusion Records ---');
    await client.query(`DELETE FROM clinical.transfusion_records WHERE tenant_id = $1`, [CANONICAL_TENANT]);

    const compRes = await client.query(`SELECT id, component_code, component_type, blood_group FROM clinical.blood_components WHERE tenant_id = $1 LIMIT 2;`, [CANONICAL_TENANT]);
    const encRes = await client.query(`SELECT id, patient_id FROM clinical.encounters WHERE tenant_id = $1 LIMIT 2;`, [CANONICAL_TENANT]);

    for (let i = 0; i < Math.min(compRes.rows.length, encRes.rows.length); i++) {
      const comp = compRes.rows[i];
      const enc = encRes.rows[i];
      const patQ = await client.query(`SELECT first_name, last_name, mrn FROM clinical.patients WHERE id = $1;`, [enc.patient_id]);
      const pat = patQ.rows[0];

      await client.query(`
        INSERT INTO clinical.transfusion_records (
          id, tenant_id, partner_id, organization_id, branch_id,
          transfusion_code, patient_name, patient_mrn, encounter_id,
          component_code, component_type, blood_group,
          administered_by_nurse, supervising_doctor_name,
          start_time, end_time, pre_transfusion_pulse, pre_transfusion_bp,
          pre_transfusion_temp_f, post_transfusion_pulse, post_transfusion_bp,
          post_transfusion_temp_f, adverse_reaction_noted, status, outcome_notes
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11,
          'Staff Nurse Kavita Rathi (NABH Bedside Cross-Checked)', 'Dr. Vivek Sharma, MD',
          NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour',
          78, '120/80', 98.4,
          80, '122/82', 98.6,
          false, 'COMPLETED',
          '1 Unit PRBC transfused over 90 mins without fever, urticaria, or hemovigilance incident.'
        );
      `, [
        CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
        `TX-2026-00${i + 1}`, `${pat.first_name} ${pat.last_name || ''}`.trim(), pat.mrn, enc.id,
        comp.component_code || `BC-2026-00${i + 1}`, comp.component_type || 'PRBC', comp.blood_group || 'O_POSITIVE'
      ]);
    }
    console.log('✔ Seeded completed clinical blood transfusion safety records.');

    console.log('\n--- 4. Seeding Supply Chain Warehouses & Stock Transfers ---');
    await client.query(`DELETE FROM clinical.supply_chain_transfer_items WHERE tenant_id = $1`, [CANONICAL_TENANT]);
    await client.query(`DELETE FROM clinical.supply_chain_transfers WHERE tenant_id = $1`, [CANONICAL_TENANT]);
    await client.query(`DELETE FROM clinical.supply_chain_inventory WHERE tenant_id = $1`, [CANONICAL_TENANT]);
    await client.query(`DELETE FROM clinical.supply_chain_warehouses WHERE tenant_id = $1`, [CANONICAL_TENANT]);

    const whMain = await client.query(`
      INSERT INTO clinical.supply_chain_warehouses (
        id, tenant_id, partner_id, organization_id, branch_id,
        code, name, type, department_name, location, is_cold_chain,
        status, manager_name, contact_number
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        'WH-MAIN', 'Central Hospital Pharmacy & Surgical Depot', 'CENTRAL_DEPOT',
        'CENTRAL_PHARMACY', 'Basement Wing B, Room B-12', true,
        'ACTIVE', 'Rajesh Gupta, Supply Chain Lead', '+91-9876543210'
      ) RETURNING id;
    `, [CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH]);
    const mainWhId = whMain.rows[0].id;

    const whEr = await client.query(`
      INSERT INTO clinical.supply_chain_warehouses (
        id, tenant_id, partner_id, organization_id, branch_id,
        code, name, type, department_name, location, is_cold_chain,
        status, manager_name, contact_number
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        'WH-ER', 'Emergency Crash Cart & Resuscitation Sub-Store', 'SUB_STORE',
        'EMERGENCY', 'Ground Floor Emergency Trauma Bay 2', true,
        'ACTIVE', 'Sister Mary (ER Charge Nurse)', '+91-9876543211'
      ) RETURNING id;
    `, [CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH]);
    const erWhId = whEr.rows[0].id;

    const whOt = await client.query(`
      INSERT INTO clinical.supply_chain_warehouses (
        id, tenant_id, partner_id, organization_id, branch_id,
        code, name, type, department_name, location, is_cold_chain,
        status, manager_name, contact_number
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        'WH-OT', 'Operation Theatre Sterile Consumables Sub-Store', 'SUB_STORE',
        'SURGERY', '2nd Floor OT Complex Sterile Corridor', false,
        'ACTIVE', 'OT In-charge Shashi Kumar', '+91-9876543212'
      ) RETURNING id;
    `, [CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH]);
    const otWhId = whOt.rows[0].id;

    // Seed stock transfer from Main to ER
    await client.query(`
      INSERT INTO clinical.supply_chain_transfers (
        id, tenant_id, partner_id, organization_id, branch_id,
        transfer_number, source_warehouse_id, source_warehouse_name,
        destination_warehouse_id, destination_warehouse_name,
        requesting_department, status, requested_by, requested_at,
        approved_by, approved_at, dispatched_by, dispatched_at,
        received_by, received_at, notes
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        'TRF-2026-0001', $5, 'Central Hospital Pharmacy & Surgical Depot',
        $6, 'Emergency Crash Cart & Resuscitation Sub-Store',
        'EMERGENCY', 'COMPLETED', 'Sister Mary (ER Charge)', NOW() - INTERVAL '5 hours',
        'Rajesh Gupta (Supply Lead)', NOW() - INTERVAL '4 hours',
        'Store Exec Anil', NOW() - INTERVAL '3 hours',
        'Sister Mary', NOW() - INTERVAL '2 hours',
        'Emergency Crash Cart Refill: Adrenaline, Atropine, IV Cannulae, and Normal Saline 500ml'
      );
    `, [
      CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      mainWhId, erWhId
    ]);

    console.log('✔ Seeded 3 Supply Chain Warehouses and verified inter-depot stock transfer.');

    console.log('\n============================================================');
    console.log('✅ TRANSACTIONAL CLINICAL RESULTS & CHECKLISTS SEEDED 100%');
    console.log('============================================================');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
