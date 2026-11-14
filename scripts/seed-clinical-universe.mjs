/**
 * Master Clinical Universe Seeder
 * Populates real transactional clinical data into PostgreSQL 18.4 for DocSearch HealthOS.
 * Target: 100% Industry Standard Live Hospital Environment.
 */

import pg from 'pg';

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const client = new Client({ connectionString: dbUrl });

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const PARTNER_ID = '00000000-0000-4000-8000-000000000001';
const ORG_ID = '00000000-0000-4000-8000-000000000002';
const BRANCH_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FACILITY_ID = '00000000-0000-4000-8000-000000000003';
const UNIT_ID = '55555555-5555-4555-8555-555555555501';

const INDIAN_FIRST_NAMES_MALE = ['Aarav', 'Rajesh', 'Amit', 'Vikram', 'Rohan', 'Suresh', 'Manish', 'Karan', 'Deepak', 'Alok', 'Sunil', 'Naveen', 'Arjun', 'Pradeep', 'Sanjay', 'Aditya', 'Harish', 'Gaurav', 'Mukesh', 'Dev'];
const INDIAN_FIRST_NAMES_FEMALE = ['Priya', 'Sunita', 'Ananya', 'Kavita', 'Pooja', 'Neha', 'Meena', 'Ritu', 'Shreya', 'Sneha', 'Geeta', 'Divya', 'Deepika', 'Kiran', 'Anita', 'Swati', 'Preeti', 'Rekha', 'Archana', 'Nisha'];
const INDIAN_LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Malhotra', 'Joshi', 'Mehta', 'Reddy', 'Nair', 'Iyer', 'Choudhury', 'Bose', 'Das', 'Khan', 'Aggarwal', 'Mishra', 'Pandey', 'Saxena'];
const BLOOD_GROUPS = ['A_POSITIVE', 'B_POSITIVE', 'O_POSITIVE', 'AB_POSITIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'O_NEGATIVE', 'AB_NEGATIVE'];

async function seed() {
  console.log('🚀 Connecting to PostgreSQL at:', dbUrl.replace(/:[^:@]+@/, ':***@'));
  await client.connect();

  try {
    console.log('--- 1. Ensuring Core Organization & Facility Infrastructure ---');
    await client.query(`
      INSERT INTO core.tenants (id, name, slug, status)
      VALUES ($1, 'Doc Search Healthcare Network', 'docsearch-health', 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `, [TENANT_ID]);

    await client.query(`
      INSERT INTO core.branches (id, tenant_id, name, code, status)
      VALUES ($1, $2, 'Doc Search Core Facility Branch', 'BR-CORE-01', 'ACTIVE')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `, [BRANCH_ID, TENANT_ID]);

    await client.query(`
      INSERT INTO clinical.operational_partners (id, tenant_id, partner_code, legal_business_name, partner_type, contact_email, status)
      VALUES ($1, $2, 'PRT-DOCSEARCH', 'Doc Search Healthcare Pvt Ltd', 'HOSPITAL_SYSTEM', 'partner@docsearch.health', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `, [PARTNER_ID, TENANT_ID]);

    await client.query(`
      INSERT INTO clinical.operational_organizations (id, tenant_id, partner_id, organization_code, organization_name, organization_type, contact_email, status)
      VALUES ($1, $2, $3, 'ORG-DOCSEARCH-MAIN', 'Doc Search Multi-Specialty Hospital', 'HOSPITAL', 'hospital@docsearch.health', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `, [ORG_ID, TENANT_ID, PARTNER_ID]);

    await client.query(`
      INSERT INTO clinical.operational_facilities (
        id, tenant_id, partner_id, organization_id, facility_code, facility_name, facility_type,
        address_street, address_city, address_state, address_postal_code, address_country,
        contact_email, contact_phone, status
      )
      VALUES (
        $1, $2, $3, $4, 'FAC-MAIN', 'Doc Search Medical Center - Central Facility', 'INPATIENT_HOSPITAL',
        '100 Medical Blvd, Sector 4', 'New Delhi', 'Delhi', '110001', 'IN',
        'downtown@docsearch.health', '+91-11-23456789', 'ACTIVE'
      )
      ON CONFLICT (id) DO UPDATE SET facility_name = EXCLUDED.facility_name;
    `, [FACILITY_ID, TENANT_ID, PARTNER_ID, ORG_ID]);

    // Ensure departments
    const deptMap = {};
    const depts = [
      { code: 'DEP-GEN-MED', name: 'General Medicine & OPD' },
      { code: 'DEP-CARDIO', name: 'Cardiology Department' },
      { code: 'DEP-ORTHO', name: 'Orthopedics & Trauma' },
      { code: 'DEP-PEDIA', name: 'Pediatrics Department' },
      { code: 'DEP-GYNAE', name: 'Obstetrics & Gynecology' },
      { code: 'DEP-ICU', name: 'Critical Care & ICU' },
      { code: 'DEP-EMERG', name: 'Emergency & Trauma Center' },
      { code: 'DEP-PATH', name: 'Pathology & Diagnostic Laboratory' },
      { code: 'DEP-RADIO', name: 'Radiology & Imaging Sciences' },
      { code: 'DEP-PHARM', name: 'Central Hospital Pharmacy' }
    ];

    for (const d of depts) {
      const res = await client.query(`
        INSERT INTO clinical.operational_departments (id, tenant_id, partner_id, organization_id, branch_id, department_code, department_name, status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'ACTIVE')
        ON CONFLICT (department_code) DO UPDATE SET department_name = EXCLUDED.department_name
        RETURNING id, department_code;
      `, [TENANT_ID, PARTNER_ID, ORG_ID, FACILITY_ID, d.code, d.name]);
      deptMap[d.code] = res.rows[0].id;
    }
    console.log(`✅ Seeded ${Object.keys(deptMap).length} Clinical Departments.`);

    // Ensure Staff & Doctor Profiles
    const doctorMap = {};
    const doctors = [
      { code: 'DOC-VERMA-01', name: 'Dr. Alok Verma', spec: 'Cardiology', dept: 'DEP-CARDIO', qual: 'MBBS, MD, DM (Cardiology)' },
      { code: 'DOC-RAJESH-01', name: 'Dr. Rajesh Sharma', spec: 'General Medicine', dept: 'DEP-GEN-MED', qual: 'MBBS, MD (Medicine)' },
      { code: 'DOC-PRIYA-01', name: 'Dr. Priya Nair', spec: 'Obstetrics & Gynecology', dept: 'DEP-GYNAE', qual: 'MBBS, MS (OBG)' },
      { code: 'DOC-KAPOOR-01', name: 'Dr. Vikram Kapoor', spec: 'Orthopedics', dept: 'DEP-ORTHO', qual: 'MBBS, MS (Ortho)' },
      { code: 'DOC-MEENA-01', name: 'Dr. Meena Iyer', spec: 'Pediatrics', dept: 'DEP-PEDIA', qual: 'MBBS, MD (Pediatrics)' }
    ];

    for (const doc of doctors) {
      const existing = await client.query('SELECT id, doctor_code FROM clinical.doctor_profiles WHERE doctor_code = $1;', [doc.code]);
      if (existing.rows[0]) {
        doctorMap[doc.code] = existing.rows[0].id;
      } else {
        const staffRes = await client.query(`
          INSERT INTO clinical.operational_staff (
            id, tenant_id, partner_id, organization_id, branch_id, department_id,
            staff_code, "fullName", work_email, work_phone, staff_type, primary_role,
            employment_type, employment_status, joining_date
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            $6, $7, $8, '+91-9876543210', 'DOCTOR', 'CONSULTANT_PHYSICIAN',
            'FULL_TIME', 'ACTIVE', '2024-01-01'
          )
          ON CONFLICT (staff_code) DO UPDATE SET "fullName" = EXCLUDED."fullName"
          RETURNING id;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, FACILITY_ID, deptMap[doc.dept],
          `STF-${doc.code}`, doc.name, `${doc.code.toLowerCase()}@docsearch.health`
        ]);
        const staffId = staffRes.rows[0].id;

        const res = await client.query(`
          INSERT INTO clinical.doctor_profiles (
            id, tenant_id, partner_id, organization_id, branch_id, department_id,
            staff_id, doctor_code, medical_license_number, qualification, experience_years, primary_specialty,
            availability_status, status
          )
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 12, $10, 'AVAILABLE', 'ACTIVE')
          RETURNING id, doctor_code;
        `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, deptMap[doc.dept], staffId, doc.code, `MCI-DL-2014-${doc.code.slice(-2)}`, doc.qual, doc.spec]);
        doctorMap[doc.code] = res.rows[0].id;
      }
    }
    console.log(`✅ Verified ${Object.keys(doctorMap).length} Specialist Doctor Profiles.`);

    // 2. Inpatient Units, Wards & Rooms
    console.log('--- 2. Seeding Inpatient Units, Wards, Rooms & Beds ---');
    await client.query(`
      INSERT INTO clinical.inpatient_units (id, tenant_id, partner_id, organization_id, branch_id, unit_code, unit_name, is_active)
      VALUES ($1, $2, $3, $4, $5, 'UNIT-CENTRAL-01', 'Central Inpatient Pavilion', true)
      ON CONFLICT (id) DO NOTHING;
    `, [UNIT_ID, TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID]);

    const wardDefs = [
      { code: 'WARD-ICU-01', name: 'Intensive Critical Care Unit (ICU)', type: 'ICU', care: 'LEVEL_3_ICU', gender: 'CO_ED', beds: 6 },
      { code: 'WARD-HDU-01', name: 'High Dependency Unit (HDU)', type: 'HDU', care: 'LEVEL_2_HDU', gender: 'CO_ED', beds: 6 },
      { code: 'WARD-GEN-M', name: 'General Medical Ward (Male)', type: 'GENERAL', care: 'LEVEL_1_ROUTINE', gender: 'MALE_ONLY', beds: 8 },
      { code: 'WARD-GEN-F', name: 'General Medical Ward (Female)', type: 'GENERAL', care: 'LEVEL_1_ROUTINE', gender: 'FEMALE_ONLY', beds: 8 }
    ];

    const seededWards = [];
    for (const w of wardDefs) {
      const existingWard = await client.query('SELECT id, ward_code, ward_name, ward_type FROM clinical.inpatient_wards WHERE ward_code = $1;', [w.code]);
      let wardId;
      if (existingWard.rows[0]) {
        wardId = existingWard.rows[0].id;
      } else {
        const wardRes = await client.query(`
          INSERT INTO clinical.inpatient_wards (
            id, tenant_id, partner_id, organization_id, branch_id, unit_id,
            ward_code, ward_name, ward_type, care_level, building, floor,
            nursing_station_name, gender_policy, isolation_capable, ventilator_capable,
            total_beds, active_beds, occupied_beds, blocked_beds, cleaning_beds, is_active
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            $6, $7, $8, $9, 'Tower A - Main Wing', '3rd Floor',
            'Central Nursing Bay 3', $10, true, $11,
            $12, $12, 0, 0, 0, true
          )
          RETURNING id, ward_code, ward_name, ward_type;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, UNIT_ID,
          w.code, w.name, w.type, w.care, w.gender,
          w.type === 'ICU', w.beds
        ]);
        wardId = wardRes.rows[0].id;
      }
      seededWards.push({ id: wardId, ward_code: w.code, ward_name: w.name, ward_type: w.type, bedCount: w.beds });
    }

    // Seed Beds for each ward
    const seededBeds = [];
    for (const ward of seededWards) {
      // Room
      const roomRes = await client.query(`
        INSERT INTO clinical.inpatient_rooms (id, tenant_id, partner_id, organization_id, branch_id, ward_id, room_number, room_class, bed_count, has_medical_gas, is_active)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, true)
        ON CONFLICT DO NOTHING
        RETURNING id, room_number;
      `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, ward.id, `RM-${ward.ward_code}`, ward.ward_type, ward.bedCount]);

      const roomId = roomRes.rows[0]?.id || null;

      for (let i = 1; i <= ward.bedCount; i++) {
        const bedNum = `${ward.ward_type === 'ICU' ? 'ICU' : ward.ward_type === 'HDU' ? 'HDU' : ward.ward_code.includes('-M') ? 'GM' : 'GF'}-${String(i).padStart(2, '0')}`;
        const isIcu = ward.ward_type === 'ICU';
        const isHdu = ward.ward_type === 'HDU';

        // Check if bed already exists
        const existingBed = await client.query('SELECT id, bed_number, bed_type, status FROM clinical.inpatient_beds WHERE bed_code = $1;', [bedNum]);
        if (existingBed.rows[0]) {
          seededBeds.push({ ...existingBed.rows[0], wardId: ward.id, wardName: ward.ward_name, bed_number: bedNum });
        } else {
          const bedRes = await client.query(`
            INSERT INTO clinical.inpatient_beds (
              id, tenant_id, partner_id, organization_id, branch_id, ward_id, room_id,
              bed_code, bed_number, bed_type, bed_class, status, gender_eligibility,
              has_oxygen_port, has_suction_port, has_ventilator, has_cardiac_monitor,
              daily_charge_rate, is_active
            )
            VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, $6,
              $7, $7, $8, $9, 'AVAILABLE', $10,
              true, true, $11, $12,
              $13, true
            )
            RETURNING id, bed_number, bed_type, status;
          `, [
            TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, ward.id, roomId,
            bedNum, isIcu ? 'ICU_VENTILATOR' : isHdu ? 'STEP_DOWN' : 'STANDARD_HOSPITAL', ward.ward_type,
            ward.ward_code.includes('-M') ? 'MALE_ONLY' : ward.ward_code.includes('-F') ? 'FEMALE_ONLY' : 'ALL',
            isIcu, isIcu || isHdu,
            isIcu ? 12000 : isHdu ? 6500 : 2500
          ]);
          if (bedRes.rows[0]) {
            seededBeds.push({ ...bedRes.rows[0], wardId: ward.id, wardName: ward.ward_name, bed_number: bedNum });
          }
        }
      }
    }
    console.log(`✅ Seeded ${seededBeds.length} Inpatient Hospital Beds across ICU, HDU, General Wards.`);

    // 3. Seeding 50 Realistic Patients
    console.log('--- 3. Seeding 50 Realistic Indian Patients with ABHA, MRN, Contacts ---');
    const seededPatients = [];
    for (let i = 1; i <= 50; i++) {
      const isFemale = i % 2 === 0;
      const firstName = isFemale 
        ? INDIAN_FIRST_NAMES_FEMALE[(i - 1) % INDIAN_FIRST_NAMES_FEMALE.length]
        : INDIAN_FIRST_NAMES_MALE[(i - 1) % INDIAN_FIRST_NAMES_MALE.length];
      const lastName = INDIAN_LAST_NAMES[(i * 3) % INDIAN_LAST_NAMES.length];
      const mrn = `UHID-2026-${String(i).padStart(4, '0')}`;
      const patientCode = `PAT-${String(i).padStart(4, '0')}`;
      const birthYear = 1950 + (i * 7) % 55;
      const birthMonth = String(1 + (i % 12)).padStart(2, '0');
      const birthDay = String(1 + (i * 3 % 28)).padStart(2, '0');
      const dob = `${birthYear}-${birthMonth}-${birthDay}`;
      const bloodGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
      const mobile = `+91-98${String(10000000 + i * 13579).slice(0, 8)}`;
      const abhaAddress = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@abdm`;
      const abhaNumber = `91-${String(1000 + i)}-${String(2000 + i * 2)}-${String(3000 + i * 3)}`;

      const existingPat = await client.query('SELECT id, mrn, first_name, last_name, gender, blood_group FROM clinical.patients WHERE mrn = $1;', [mrn]);
      let patRecord;
      if (existingPat.rows[0]) {
        patRecord = existingPat.rows[0];
      } else {
        const patRes = await client.query(`
          INSERT INTO clinical.patients (
            id, tenant_id, partner_id, organization_id, branch_id,
            mrn, uhid, patient_code, first_name, last_name,
            date_of_birth, gender, blood_group, marital_status,
            nationality, preferred_language, status, registration_source,
            metadata
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $5, $6, $7, $8,
            $9, $10, $11, $12,
            'INDIAN', 'HINDI', 'ACTIVE', 'FRONT_DESK_WALKIN',
            $13
          )
          RETURNING id, mrn, first_name, last_name, gender, blood_group;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          mrn, patientCode, firstName, lastName,
          dob, isFemale ? 'FEMALE' : 'MALE', bloodGroup, i > 15 ? 'MARRIED' : 'SINGLE',
          JSON.stringify({ mobileNumber: mobile, abhaAddress, abhaNumber, city: 'Delhi NCR' })
        ]);
        patRecord = patRes.rows[0];

        // Add patient contact (schema: id, tenant_id, partner_id, patient_id, primary_mobile, preferred_contact_method)
        await client.query(`
          INSERT INTO clinical.patient_contacts (
            id, tenant_id, partner_id, patient_id, primary_mobile, preferred_contact_method
          )
          VALUES (gen_random_uuid(), $1, $2, $3, $4, 'SMS_WHATSAPP')
          ON CONFLICT DO NOTHING;
        `, [TENANT_ID, PARTNER_ID, patRecord.id, mobile]);

        // Add ABHA record
        await client.query(`
          INSERT INTO clinical.patient_abha_accounts (
            id, tenant_id, partner_id, organization_id, branch_id,
            patient_id, patient_mrn, patient_name, abha_number, abha_address,
            mobile_number, gender, date_of_birth, address, kyc_status,
            abha_card_qr_payload, linked_care_contexts_count
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, $11, $12, 'Sector 4, Rohini, New Delhi, 110085', 'VERIFIED',
            $13, 1
          )
          ON CONFLICT DO NOTHING;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          patRecord.id, mrn, `${firstName} ${lastName}`, abhaNumber, abhaAddress,
          mobile, isFemale ? 'FEMALE' : 'MALE', dob,
          JSON.stringify({ hidn: abhaNumber, hid: abhaAddress, name: `${firstName} ${lastName}`, gender: isFemale ? 'F' : 'M', dob })
        ]);
      }
      seededPatients.push({ ...patRecord, mobile, abhaAddress, abhaNumber, dob });
    }
    console.log(`✅ Seeded/Verified ${seededPatients.length} Active Patients with ABHA and Primary Contacts.`);

    // 4. Seeding Encounters & OPD Queue
    console.log('--- 4. Seeding Live Encounters & OPD Waiting Queue ---');
    const seededEncounters = [];
    const chiefComplaints = [
      'Chest pain and shortness of breath upon exertion (Triage Level 2)',
      'Severe headache, dizziness, BP 160/100 mmHg',
      'Acute epigastric burning pain radiating to back',
      'Fever with chills for 3 days, body ache (suspected Dengue/Viral)',
      'Right knee swelling, severe pain on weight bearing',
      'Routine antenatal checkup (28 weeks gestation)',
      'Diabetic foot ulcer examination, fasting sugar > 220 mg/dL',
      'Persistent dry cough with nocturnal breathlessness'
    ];

    const doctorKeys = Object.keys(doctorMap);
    const primaryDocId = doctorKeys.length > 0 ? doctorMap[doctorKeys[0]] : null;
    const cardioDeptId = deptMap['DEP-CARDIO'] || deptMap['DEP-GEN-MED'];

    for (let i = 0; i < Math.min(25, seededPatients.length); i++) {
      const p = seededPatients[i];
      const encNum = `ENC-2026-${String(1001 + i)}`;
      const tokenNum = `Q-${String(i + 1).padStart(3, '0')}`;
      const status = i < 4 ? 'IN_CONSULTATION' : i < 15 ? 'WAITING' : i < 22 ? 'COMPLETED' : 'TRIAGED';
      const priority = i === 0 || i === 3 ? 'EMERGENCY' : i < 8 ? 'URGENT' : 'ROUTINE';
      const complaint = chiefComplaints[i % chiefComplaints.length];

      const existingEnc = await client.query('SELECT id, encounter_number, patient_id, status FROM clinical.encounters WHERE encounter_number = $1;', [encNum]);
      let encRecord;
      if (existingEnc.rows[0]) {
        encRecord = existingEnc.rows[0];
      } else {
        const encRes = await client.query(`
          INSERT INTO clinical.encounters (
            id, tenant_id, partner_id, organization_id, branch_id, department_id,
            patient_id, doctor_id, encounter_number, encounter_type, status, priority,
            consultation_mode, chief_complaint, registered_at, checked_in_at
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11,
            'IN_PERSON', $12, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 minutes'
          )
          RETURNING id, encounter_number, patient_id, status;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, cardioDeptId,
          p.id, primaryDocId, encNum, i % 5 === 0 ? 'EMERGENCY' : 'OPD_CONSULTATION', status, priority,
          complaint
        ]);
        encRecord = encRes.rows[0];

        // Add queue token (schema: id, tenant_id, partner_id, organization_id, branch_id, department_id, doctor_id, encounter_id, token_number, queue_date, queue_status, estimated_wait_minutes)
        await client.query(`
          INSERT INTO clinical.encounter_queues (
            id, tenant_id, partner_id, organization_id, branch_id,
            department_id, doctor_id, encounter_id, token_number, queue_date, queue_status, estimated_wait_minutes
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, CURRENT_DATE, $9, $10
          )
          ON CONFLICT DO NOTHING;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          cardioDeptId, primaryDocId, encRecord.id, tokenNum,
          status === 'IN_CONSULTATION' ? 'CALLED' : status === 'WAITING' ? 'WAITING' : 'DISMISSED',
          status === 'WAITING' ? (i * 10) : 0
        ]);
      }
      seededEncounters.push({ ...encRecord, patientName: `${p.first_name} ${p.last_name}`, mrn: p.mrn });
    }
    console.log(`✅ Seeded ${seededEncounters.length} Live Encounters with Queue Tokens.`);

    // 5. Inpatient Admissions & Bed Allocation
    console.log('--- 5. Seeding Inpatient Ward Admissions & Bed Occupancy ---');
    const admittedCount = Math.min(8, seededBeds.length);
    for (let i = 0; i < admittedCount; i++) {
      const p = seededPatients[i + 20];
      const bed = seededBeds[i];
      const admNum = `IPD-2026-${String(501 + i)}`;

      const existingAdm = await client.query('SELECT id FROM clinical.inpatient_admissions WHERE admission_number = $1;', [admNum]);
      let admId;
      if (existingAdm.rows[0]) {
        admId = existingAdm.rows[0].id;
      } else {
        const admRes = await client.query(`
          INSERT INTO clinical.inpatient_admissions (
            id, tenant_id, partner_id, organization_id, branch_id,
            admission_number, patient_id, patient_name, patient_mrn, patient_gender, patient_age,
            admitting_doctor_name, attending_consultant_name, department, specialty,
            ward_id, ward_name, bed_id, bed_code,
            admission_type, admission_source, admission_date_time, expected_discharge_date,
            primary_diagnosis, status, financial_deposit_amount,
            isolation_required, billing_cleared, insurance_cleared, clinical_clearance, discharge_summary_finalized
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9, $10,
            'Dr. Alok Verma', 'Dr. Rajesh Sharma', 'Critical Care', 'Internal Medicine',
            $11, $12, $13, $14,
            $15, 'EMERGENCY_DEPT', NOW() - INTERVAL '24 hours', NOW() + INTERVAL '3 days',
            $16, 'ADMITTED', $17,
            false, false, false, false, false
          )
          RETURNING id;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          admNum, p.id, `${p.first_name} ${p.last_name}`, p.mrn, p.gender, 48 + i * 3,
          bed.wardId, bed.wardName, bed.id, bed.bed_number,
          bed.bed_type === 'ICU_VENTILATOR' ? 'EMERGENCY_SURGE' : 'ELECTIVE',
          bed.bed_type === 'ICU_VENTILATOR' ? 'Acute Myocardial Infarction / Cardiogenic Shock' : 'Severe Community Acquired Pneumonia',
          bed.bed_type === 'ICU_VENTILATOR' ? 50000 : 20000
        ]);
        admId = admRes.rows[0].id;

        // Update bed to OCCUPIED
        await client.query(`
          UPDATE clinical.inpatient_beds 
          SET status = 'OCCUPIED', current_patient_id = $1, current_admission_id = $2, last_occupied_at = NOW()
          WHERE id = $3;
        `, [p.id, admId, bed.id]);

        // Add live vitals observation (schema: id, tenant_id, partner_id, organization_id, branch_id, admission_id, patient_id, recorded_by, temperature_celsius, pulse_bpm, respiratory_rate_bpm, systolic_bp_mm_hg, diastolic_bp_mm_hg, spo2_percentage, is_abnormal, recorded_at)
        await client.query(`
          INSERT INTO clinical.inpatient_vital_observations (
            id, tenant_id, partner_id, organization_id, branch_id,
            admission_id, patient_id, recorded_by,
            temperature_celsius, pulse_bpm, respiratory_rate_bpm, systolic_bp_mm_hg, diastolic_bp_mm_hg, spo2_percentage,
            is_abnormal, recorded_at
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, 'Staff Nurse Anjali',
            37.1, $7, 18, $8, $9, $10,
            $11, NOW() - INTERVAL '15 minutes'
          )
          ON CONFLICT DO NOTHING;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          admId, p.id,
          76 + (i * 3), 125 + (i * 4), 82 + (i * 2), 98 - (i % 3),
          i === 0
        ]);
      }
    }
    console.log(`✅ Seeded ${admittedCount} Active Ward Admissions with Bed Links & NEWS2 Vitals.`);

    // 6. Seeding Billing Invoices, Line Items & Payments
    console.log('--- 6. Seeding 25 Real Invoices, Line Items & Counter Payments ---');
    let invoiceCount = 0;
    for (let i = 0; i < seededEncounters.length; i++) {
      const enc = seededEncounters[i];
      const invNum = `INV-2026-${String(88001 + i)}`;
      const isPaid = i < 10;
      const isPending = i >= 10 && i < 20;
      const status = isPaid ? 'PAID' : isPending ? 'PENDING_PAYMENT' : 'PARTIALLY_PAID';
      
      const subtotal = 1500.00;
      const discount = i % 4 === 0 ? 200.00 : 0.00;
      const tax = 0.00;
      const total = subtotal - discount + tax;
      const paid = isPaid ? total : status === 'PARTIALLY_PAID' ? 500.00 : 0.00;
      const due = total - paid;

      const existingInv = await client.query('SELECT id FROM clinical.billing_invoices WHERE invoice_number = $1;', [invNum]);
      if (existingInv.rows[0]) {
        invoiceCount++;
      } else {
        const invRes = await client.query(`
          INSERT INTO clinical.billing_invoices (
            id, tenant_id, partner_id, organization_id, branch_id,
            patient_id, encounter_id, invoice_number, invoice_type, status,
            subtotal, discount_total, tax_total, total_amount, paid_amount, due_amount,
            currency, issued_at, metadata
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, 'OUTPATIENT_BILL', $8,
            $9, $10, $11, $12, $13, $14,
            'INR', NOW() - INTERVAL '3 hours',
            $15
          )
          RETURNING id, invoice_number;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          enc.patient_id, enc.id, invNum, status,
          subtotal, discount, tax, total, paid, due,
          JSON.stringify({ patientName: enc.patientName, patientMrn: enc.mrn, counter: 'Counter-01' })
        ]);

        if (invRes.rows[0]) {
          const inv = invRes.rows[0];
          invoiceCount++;

          // Add 2 line items per invoice
          await client.query(`
            INSERT INTO clinical.billing_invoice_items (
              id, tenant_id, invoice_id, service_code, description,
              quantity, unit_price, gross_amount, discount_amount, tax_amount, net_amount
            )
            VALUES 
            (gen_random_uuid(), $1, $2, 'SRV-CONS-01', 'Specialist Doctor Consultation (Cardiology)', 1, 800.00, 800.00, 0, 0, 800.00),
            (gen_random_uuid(), $1, $2, 'SRV-ECG-01', '12-Lead Electrocardiogram (ECG) Recording', 1, 700.00, 700.00, $3, 0, 700.00 - $3);
          `, [TENANT_ID, inv.id, discount]);

          // Add payment record if paid or partially paid
          if (paid > 0) {
            await client.query(`
              INSERT INTO clinical.billing_payments (
                id, tenant_id, partner_id, organization_id, branch_id,
                patient_id, invoice_id, payment_number, payment_method,
                amount, currency, reference_number, status, received_by, received_at
              )
              VALUES (
                gen_random_uuid(), $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, 'INR', $10, 'SUCCESS', 'Cashier Counter 1', NOW() - INTERVAL '1 hour'
              )
              ON CONFLICT DO NOTHING;
            `, [
              TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
              enc.patient_id, inv.id, `RCP-2026-${String(4001 + i)}`,
              i % 2 === 0 ? 'UPI_QR' : 'CASH', paid, `UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`
            ]);
          }
        }
      }
    }
    console.log(`✅ Seeded ${invoiceCount} Billing Invoices with Line Items, Discounts & Settlement Receipts.`);

    // 7. Seeding Pathology Lab Orders & Specimens
    console.log('--- 7. Seeding Pathology Lab Orders & Specimens ---');
    const labTests = [
      { code: 'LAB-CBC', name: 'Complete Blood Count (CBC) with Automated Differential', category: 'HEMATOLOGY', sample: 'WHOLE_BLOOD', tube: 'EDTA_LAVENDER' },
      { code: 'LAB-LFT', name: 'Liver Function Profile Comprehensive (LFT)', category: 'BIOCHEMISTRY', sample: 'SERUM', tube: 'SERUM_GOLD_SST' },
      { code: 'LAB-KFT', name: 'Kidney Function Test & Electrolytes (KFT)', category: 'BIOCHEMISTRY', sample: 'SERUM', tube: 'SERUM_GOLD_SST' },
      { code: 'LAB-LIPID', name: 'Lipid Profile Extended (Cholesterol, Triglycerides, HDL, LDL)', category: 'BIOCHEMISTRY', sample: 'SERUM', tube: 'SERUM_GOLD_SST' },
      { code: 'LAB-HBA1C', name: 'Glycated Hemoglobin (HbA1c) HPLC Gold Standard', category: 'BIOCHEMISTRY', sample: 'WHOLE_BLOOD', tube: 'EDTA_LAVENDER' }
    ];

    const labCatalogMap = {};
    for (const lt of labTests) {
      const existing = await client.query('SELECT id FROM clinical.investigation_catalog WHERE test_code = $1;', [lt.code]);
      if (existing.rows[0]) {
        labCatalogMap[lt.code] = existing.rows[0].id;
      } else {
        const ins = await client.query(`
          INSERT INTO clinical.investigation_catalog (
            id, tenant_id, partner_id, organization_id, branch_id,
            test_code, test_name, category, specimen_type, department
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, 'Laboratory Services'
          )
          RETURNING id;
        `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, lt.code, lt.name, lt.category, lt.sample]);
        labCatalogMap[lt.code] = ins.rows[0].id;
      }
    }

    let orderCount = 0;
    for (let i = 0; i < Math.min(15, seededPatients.length); i++) {
      const p = seededPatients[i];
      const test = labTests[i % labTests.length];
      const ordNum = `ORD-LAB-${String(2026001 + i)}`;
      const status = i < 3 ? 'RESULT_READY' : i < 8 ? 'PROCESSING' : i < 12 ? 'SAMPLE_COLLECTED' : 'ORDERED';
      const isCritical = i === 0;

      const enc = seededEncounters.find(e => e.patient_id === p.id) || seededEncounters[i % seededEncounters.length];
      const invCatId = labCatalogMap[test.code];

      const existingOrd = await client.query('SELECT id FROM clinical.investigation_orders WHERE order_number = $1;', [ordNum]);
      let orderId;
      if (existingOrd.rows[0]) {
        orderId = existingOrd.rows[0].id;
        orderCount++;
      } else {
        const ordRes = await client.query(`
          INSERT INTO clinical.investigation_orders (
            id, tenant_id, partner_id, organization_id, branch_id,
            order_number, patient_id, encounter_id, ordering_doctor_id, investigation_id,
            priority, clinical_indication, specimen_type, status, is_critical, ordered_at
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, 'Evaluation of clinical symptoms and routine workup',
            $11, $12, $13, NOW() - INTERVAL '4 hours'
          )
          RETURNING id;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID,
          ordNum, p.id, enc.id, primaryDocId, invCatId,
          isCritical ? 'STAT' : 'ROUTINE',
          test.sample, status, isCritical
        ]);
        orderId = ordRes.rows[0].id;
        orderCount++;

        // Add specimen record
        await client.query(`
          INSERT INTO clinical.investigation_specimens (
            id, tenant_id, partner_id, organization_id, order_id, patient_id,
            accession_number, specimen_type, container_type, collection_status, collected_at
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5,
            $6, $7, $8, $9, NOW() - INTERVAL '3 hours'
          )
          ON CONFLICT DO NOTHING;
        `, [
          TENANT_ID, PARTNER_ID, ORG_ID, orderId, p.id,
          `ACC-${String(900000 + i)}`, test.sample, test.tube,
          status === 'ORDERED' ? 'PENDING' : 'RECEIVED_IN_LAB'
        ]);

        // Add critical panic alert if critical
        if (isCritical) {
          await client.query(`
            INSERT INTO clinical.critical_panic_value_alerts (
              id, tenant_id, partner_id, organization_id, branch_id,
              patient_mrn, patient_name, location, test_name, measured_value, normal_range,
              panic_threshold, category, urgency_level, clinical_risk_summary,
              communicated_to_doc, doctor_name, alert_timestamp
            )
            VALUES (
              gen_random_uuid(), $1, $2, $3, $4,
              $5, $6, 'ICU Bed 01', 'Serum Potassium (K+)', '6.8 mEq/L', '3.5 - 5.0 mEq/L',
              '> 6.5 mEq/L Critical High', 'BIOCHEMISTRY', 'STAT_IMMEDIATE',
              'Severe hyperkalemia. Risk of fatal cardiac dysrhythmia or ventricular fibrillation.',
              true, 'Dr. Alok Verma', NOW() - INTERVAL '12 minutes'
            )
            ON CONFLICT DO NOTHING;
          `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, p.mrn, `${p.first_name} ${p.last_name}`]);
        }
      }
    }
    console.log(`✅ Seeded ${orderCount} Pathology Investigation Orders & NABL Panic Alerts.`);

    // 8. Seeding Pharmacy Inventory & Batches
    console.log('--- 8. Seeding Pharmacy Shelf Inventory & Batches ---');
    const catalogMeds = await client.query('SELECT id, generic_name, brand_name, dosage_form FROM clinical.medication_catalog LIMIT 20;');
    let batchCount = 0;
    for (const med of catalogMeds.rows) {
      await client.query(`
        INSERT INTO clinical.pharmacy_inventory (
          id, tenant_id, partner_id, organization_id, branch_id,
          medication_id, available_quantity, reserved_quantity, reorder_level, reorder_quantity
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, 450, 20, 100, 500
        )
        ON CONFLICT DO NOTHING;
      `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, med.id]);

      // Add batch
      const batchNum = `BTH-${med.brand_name ? med.brand_name.substring(0, 3).toUpperCase() : 'MED'}-${Math.floor(1000 + Math.random() * 9000)}`;
      await client.query(`
        INSERT INTO clinical.pharmacy_batches (
          id, tenant_id, partner_id, organization_id, branch_id,
          medication_id, batch_number, manufacturer, manufacturing_date, expiry_date,
          received_quantity, available_quantity, reserved_quantity, unit_cost, status
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, $6, 'Sun Pharma Laboratories Ltd', NOW() - INTERVAL '6 months', NOW() + INTERVAL '2 years',
          500, 450, 0, 4.50, 'ACTIVE'
        )
        ON CONFLICT DO NOTHING;
      `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID, med.id, batchNum]);
      batchCount++;
    }
    console.log(`✅ Seeded ${batchCount} Pharmacy Active Medication Batches & Stock.`);

    // 9. Seeding Executive Command Snapshot
    console.log('--- 9. Seeding Executive Command Situational Metrics ---');
    await client.query(`
      INSERT INTO clinical.executive_command_snapshots (
        id, tenant_id, partner_id, organization_id, branch_id,
        hospital_name, snapshot_timestamp, surge_level, active_emergency_codes,
        total_beds, occupied_beds, bed_occupancy_pct, available_beds_count,
        icu_beds_total, icu_beds_occupied, icu_occupancy_pct,
        ventilators_total, ventilators_in_use, ventilator_util_pct,
        ed_triage_waiting, ed_hold_admission, ed_nedocs_score, ed_nedocs_status,
        ot_suites_active, ot_suites_total, ot_util_pct,
        surgeries_in_progress, surgeries_delayed,
        daily_rev_velocity, unbilled_risk, claims_denial_risk_count,
        stat_lab_pending, stat_rad_pending,
        critical_blood_alert_count, critical_consumables_risk_count
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4,
        'Doc Search Medical Center & Super-Specialty Hospital', NOW(), 'NORMAL_GREEN', '[]'::jsonb,
        28, 8, 28.5, 20,
        6, 2, 33.3,
        6, 2, 33.3,
        5, 2, 42, 'Normal Operations',
        2, 4, 50.0,
        2, 0,
        485000.00, 18500.00, 2,
        2, 1,
        0, 0
      )
      ON CONFLICT DO NOTHING;
    `, [TENANT_ID, PARTNER_ID, ORG_ID, BRANCH_ID]);
    console.log('✅ Executive Command Snapshot seeded.');

    console.log('\n🎉 ALL 9 CLINICAL TIERS SEEDED 100% SUCCESSFULLY INTO POSTGRESQL!');
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    throw err;
  } finally {
    await client.end();
  }
}

seed();
