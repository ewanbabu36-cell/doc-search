import pg from 'pg';
import crypto from 'node:crypto';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';
const CANONICAL_BRANCH = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CANONICAL_PARTNER = '1c14ebdd-af6d-44df-afa3-fe1e91301d15';
const CANONICAL_ORG = '649e0fdb-af37-43c1-acea-23f35ffe4ad5';
const CANONICAL_FACILITY = '5a0cb96b-b80f-43db-aa18-1780ededd1b6';

async function main() {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  await client.connect();

  console.log('=== SEEDING EMERGENCY, BLOOD BANK & DOCTOR SCHEDULES ===\n');

  // 1. Harmonize emergency_encounters to canonical tenant
  console.log('1. Harmonizing emergency_encounters...');
  await client.query(`
    UPDATE clinical.emergency_encounters
    SET tenant_id = $1, branch_id = COALESCE(branch_id, $2)
    WHERE tenant_id != $1
  `, [CANONICAL_TENANT, CANONICAL_BRANCH]);
  const encRes = await client.query('SELECT id, patient_name FROM clinical.emergency_encounters WHERE tenant_id = $1 LIMIT 5', [CANONICAL_TENANT]);
  console.log(`   Harmonized emergency_encounters. Found ${encRes.rows.length} encounters.`);

  // 2. Emergency Department & Zones
  console.log('2. Seeding Emergency Department & Zones...');
  const deptId = '70000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO clinical.emergency_departments (
      id, tenant_id, partner_id, organization_id, branch_id,
      department_code, department_name, total_beds, resuscitation_beds,
      trauma_beds, observation_beds, head_of_emergency, is_disaster_mode_active,
      is_active, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'EMERG-CENTRAL-01', 'Apex Trauma & Emergency Department (Level 1)',
      24, 4, 6, 14, 'Dr. Rajiv Menon, MD (Emergency Medicine)', false,
      true, NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id;
  `, [deptId, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH]);

  const zones = [
    { id: '71000000-0000-4000-8000-000000000001', code: 'ZONE-RED', name: 'Red Zone (Immediate Resuscitation)', type: 'RESUSCITATION', cap: 4, occ: 2, fee: 1500 },
    { id: '71000000-0000-4000-8000-000000000002', code: 'ZONE-YELLOW', name: 'Yellow Zone (Urgent Medical Care)', type: 'URGENT', cap: 10, occ: 4, fee: 800 },
    { id: '71000000-0000-4000-8000-000000000003', code: 'ZONE-GREEN', name: 'Green Zone (Fast Track Ambulatory)', type: 'AMBULATORY', cap: 10, occ: 3, fee: 400 }
  ];

  for (const z of zones) {
    await client.query(`
      INSERT INTO clinical.emergency_zones (
        id, tenant_id, partner_id, organization_id, branch_id, department_id,
        zone_code, zone_name, zone_type, capacity, occupied_count,
        charge_per_hour, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        branch_id = EXCLUDED.branch_id;
    `, [
      z.id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH, deptId,
      z.code, z.name, z.type, z.cap, z.occ, z.fee
    ]);
  }
  console.log(`   ✓ Seeded ${zones.length} Emergency Zones (Red, Yellow, Green).\n`);

  // 3. Emergency Crash Carts
  console.log('3. Seeding Emergency Crash Carts...');
  const carts = [
    { id: '72000000-0000-4000-8000-000000000001', code: 'CC-RESUS-01', loc: 'Red Zone Bay 1-2', seal: 'SEAL-2026-9912', bat: 100, o2: 1850 },
    { id: '72000000-0000-4000-8000-000000000002', code: 'CC-TRAUMA-02', loc: 'Yellow Zone Bay 5', seal: 'SEAL-2026-9913', bat: 98, o2: 1900 }
  ];

  for (const c of carts) {
    await client.query(`
      INSERT INTO clinical.emergency_crash_carts (
        id, tenant_id, partner_id, organization_id, branch_id,
        cart_code, location_zone, seal_number, is_seal_intact,
        last_checked_at, last_checked_by, defibrillator_battery_percent,
        oxygen_cylinder_pressure_psi, has_expired_items, status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, true,
        NOW(), 'Charge Nurse Sunita Rani, B.Sc Nursing', $9,
        $10, false, 'READY_VERIFIED'
      ) ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        branch_id = EXCLUDED.branch_id;
    `, [
      c.id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      c.code, c.loc, c.seal, c.bat, c.o2
    ]);
  }
  console.log(`   ✓ Seeded ${carts.length} Emergency Crash Carts with 100% battery and intact seals.\n`);

  // 4. Emergency MLC Cases & Ambulance Transfers
  console.log('4. Seeding Emergency MLC Cases & Ambulance Transfers...');
  const firstEncId = encRes.rows[0]?.id || 'c251756c-2a2d-4d35-af43-4b57ba215454';
  const patName = encRes.rows[0]?.patient_name || 'Trauma Victim';

  await client.query(`
    INSERT INTO clinical.emergency_mlc_cases (
      id, tenant_id, partner_id, organization_id, branch_id,
      encounter_id, patient_name, mlc_number, case_type,
      police_station, police_officer_name, police_badge_number,
      fir_number, injury_description, evidence_items_collected,
      chain_of_custody_custodian, government_notification_sent,
      registered_by_doctor, timestamp
    ) VALUES (
      '73000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      $5, $6, 'MLC-2026-0081', 'ROAD_TRAFFIC_ACCIDENT',
      'Civil Lines Police Station Sector-12', 'Sub-Inspector Ramesh Dhull', 'HR-POL-4412',
      'FIR/2026/8912', 'Multiple blunt force contusions on right thoracic cage, compound fracture tibia-fibula',
      'Torn clothing sample, blood-stained watch, personal mobile handset',
      'Head Constable Virender (Duty IO)', true,
      'Dr. Rajiv Menon, CMO On Duty', NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id;
  `, [CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH, firstEncId, patName]);

  await client.query(`
    INSERT INTO clinical.emergency_ambulance_transfers (
      id, tenant_id, partner_id, organization_id, branch_id,
      encounter_id, transfer_code, patient_name, ambulance_number,
      transport_type, sending_facility, receiving_facility,
      accompanying_paramedic, transfer_reason, departure_time,
      arrival_time, status
    ) VALUES (
      '74000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      $5, 'TRANS-2026-901', $6, 'DL-01-AMB-8891',
      'ADVANCED_LIFE_SUPPORT', 'Accident Site (NH-48 KM-34)', 'DocSearch Apex Trauma Center',
      'Paramedic Vikas Sharma, EMT-P', 'Trauma Resuscitation & Emergency Orthopedic Surgery',
      NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '5 minutes', 'COMPLETED'
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id;
  `, [CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH, firstEncId, patName]);
  console.log(`   ✓ Seeded MLC case and ALS ambulance transfer record.\n`);

  // 5. Blood Bank Entity, Temperature Logs, Requests & Crossmatches
  console.log('5. Seeding Blood Bank Module...');
  const bbId = '80000000-0000-4000-8000-000000000001';
  await client.query(`
    INSERT INTO clinical.blood_banks (
      id, tenant_id, partner_id, organization_id, branch_id,
      facility_code, facility_name, license_number, medical_director_name,
      head_technologist_name, storage_location_name, total_available_units,
      quarantine_units, is_active, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'BB-ROTA-01', 'DocSearch Rotary Hospital Blood Bank & Transfusion Center',
      'DL-FDA-BB-2026-9041', 'Dr. Ramesh Sen, MD (Pathology & Transfusion)',
      'Sunil Verma, Chief Lab Technologist', 'Central Wing, Level -1 Blood Bank Vault',
      48, 2, true, NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id;
  `, [bbId, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH]);

  const temps = [
    { loc: 'PRBC Cold Storage Chiller 1', type: 'REFRIGERATOR_4C', temp: 3.8, min: 2.0, max: 6.0 },
    { loc: 'FFP Deep Freezer Vault A', type: 'DEEP_FREEZER_MINUS80', temp: -78.4, min: -85.0, max: -70.0 },
    { loc: 'Platelet Agitator Incubator', type: 'PLATELET_INCUBATOR', temp: 22.1, min: 20.0, max: 24.0 }
  ];
  for (const t of temps) {
    const tid = crypto.randomUUID();
    await client.query(`
      INSERT INTO clinical.blood_temperature_logs (
        id, tenant_id, partner_id, organization_id, branch_id,
        unit_location, storage_unit_type, recorded_temperature_c,
        target_min_c, target_max_c, is_excursion, recorded_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, false, NOW()
      );
    `, [tid, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH, t.loc, t.type, t.temp, t.min, t.max]);
  }

  // Get active blood component for crossmatching
  const compRes = await client.query('SELECT id, component_code, component_type, blood_group FROM clinical.blood_components WHERE tenant_id = $1 LIMIT 1', [CANONICAL_TENANT]);
  const activeComp = compRes.rows[0];

  if (activeComp) {
    const encRow = await client.query('SELECT id, patient_id FROM clinical.encounters LIMIT 1');
    const activeEncId = encRow.rows[0]?.id || '38cb867d-38a1-42b6-a974-d9bed9fa8e44';

    const reqId = '82000000-0000-4000-8000-000000000001';
    await client.query(`
      INSERT INTO clinical.blood_requests (
        id, tenant_id, partner_id, organization_id, branch_id,
        request_code, patient_id, patient_name, patient_mrn, encounter_id,
        requesting_department, ordering_physician_name,
        requested_component_type, patient_blood_group, quantity_units,
        urgency, clinical_indication, required_by_timestamp, status, requested_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        'BREQ-2026-001', '29bc38f8-32ef-427a-b16b-91f13792d427', 'Rajesh Kumar', 'MRN-2026-0001', $6,
        'Operation Theatre (OT 2)', 'Dr. Alok Verma, MS',
        $7, $8, 2, 'URGENT', 'Pre-op reserve for Laparoscopic Cholecystectomy',
        NOW() + INTERVAL '2 hours', 'CROSSMATCHED', NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id;
    `, [reqId, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH, activeEncId, activeComp.component_type, activeComp.blood_group]);

    await client.query(`
      INSERT INTO clinical.blood_crossmatches (
        id, tenant_id, partner_id, organization_id, branch_id,
        crossmatch_code, request_id, component_id, component_code,
        patient_name, patient_blood_group, donor_blood_group,
        major_crossmatch_result, minor_crossmatch_result, coombs_test_result,
        overall_result, testing_technician_name, verified_by_pathologist,
        crossmatched_at, expires_at
      ) VALUES (
        '83000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
        'XM-2026-001', $5, $6, $7,
        'Rajesh Kumar', $8, $8,
        'COMPATIBLE', 'COMPATIBLE', 'NEGATIVE',
        'COMPATIBLE', 'Sunil Verma, DMLT', 'Dr. Ramesh Sen, MD (Pathology)',
        NOW(), NOW() + INTERVAL '48 hours'
      ) ON CONFLICT (id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id;
    `, [
      CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH,
      reqId, activeComp.id, activeComp.component_code, activeComp.blood_group
    ]);
    console.log(`   ✓ Seeded Blood Bank, 3 Temperature Logs, Blood Request, and Compatible Crossmatch record.\n`);
  }

  // 6. Doctor Schedules (Weekly OPD Slots)
  console.log('6. Seeding Doctor OPD Schedules...');
  const docRes = await client.query('SELECT id, doctor_code FROM clinical.doctor_profiles LIMIT 2');
  if (docRes.rows.length > 0) {
    const doc1 = docRes.rows[0];
    const doc2 = docRes.rows[1] || docRes.rows[0];

    const schedules = [
      { id: '90000000-0000-4000-8000-000000000001', docId: doc1.id, day: 'MONDAY', shift: 'MORNING_OPD', start: '09:00', end: '13:00', room: 'OPD-102' },
      { id: '90000000-0000-4000-8000-000000000002', docId: doc1.id, day: 'WEDNESDAY', shift: 'MORNING_OPD', start: '09:00', end: '13:00', room: 'OPD-102' },
      { id: '90000000-0000-4000-8000-000000000003', docId: doc1.id, day: 'FRIDAY', shift: 'MORNING_OPD', start: '09:00', end: '13:00', room: 'OPD-102' },
      { id: '90000000-0000-4000-8000-000000000004', docId: doc2.id, day: 'TUESDAY', shift: 'AFTERNOON_OPD', start: '14:00', end: '18:00', room: 'OPD-204' },
      { id: '90000000-0000-4000-8000-000000000005', docId: doc2.id, day: 'THURSDAY', shift: 'AFTERNOON_OPD', start: '14:00', end: '18:00', room: 'OPD-204' }
    ];

    for (const sc of schedules) {
      await client.query(`
        INSERT INTO clinical.doctor_schedules (
          id, tenant_id, partner_id, organization_id, branch_id,
          doctor_id, day_of_week, shift_name, start_time, end_time,
          slot_duration_minutes, max_patients_per_slot, buffer_time_minutes,
          consultation_mode, room_number, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          15, 1, 5,
          'IN_PERSON_AND_TELE', $11, 'ACTIVE', NOW(), NOW()
        ) ON CONFLICT (id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id;
      `, [
        sc.id, CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_FACILITY,
        sc.docId, sc.day, sc.shift, sc.start, sc.end, sc.room
      ]);
    }
    console.log(`   ✓ Seeded ${schedules.length} weekly Doctor OPD schedules for ${doc1.doctor_code} & ${doc2.doctor_code}.\n`);
  }

  // 7. Inpatient Admission Requests
  console.log('7. Seeding Inpatient Admission Requests...');
  await client.query(`
    INSERT INTO clinical.inpatient_admission_requests (
      id, tenant_id, partner_id, organization_id, branch_id,
      request_number, patient_id, patient_name, patient_mrn,
      referring_doctor_name, admitting_doctor_name, department, specialty,
      requested_ward_type, requested_bed_class, admission_source, priority,
      is_emergency, provisional_diagnosis, admission_reason,
      expected_length_of_stay_days, status, created_at, updated_at
    ) VALUES (
      '95000000-0000-4000-8000-000000000001', $1, $2, $3, $4,
      'ADM-REQ-2026-001', '29bc38f8-32ef-427a-b16b-91f13792d427', 'Rajesh Kumar', 'MRN-2026-0001',
      'Dr. Vivek Sharma', 'Dr. Alok Verma', 'General Surgery', 'GI Surgery',
      'SURGICAL_WARD', 'SEMI_PRIVATE', 'OPD_TRANSFER', 'ROUTINE',
      false, 'Symptomatic Cholelithiasis with recurrent biliary colic',
      'Elective Laparoscopic Cholecystectomy under General Anesthesia',
      3, 'PENDING_BED_ALLOCATION', NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id;
  `, [CANONICAL_TENANT, CANONICAL_PARTNER, CANONICAL_ORG, CANONICAL_BRANCH]);
  console.log('   ✓ Seeded Inpatient Admission Request for Rajesh Kumar.\n');

  await client.end();
  console.log('=== ALL CLINICAL WORKFLOWS SEEDED SUCCESSFULLY ===');
}

main().catch(console.error);
