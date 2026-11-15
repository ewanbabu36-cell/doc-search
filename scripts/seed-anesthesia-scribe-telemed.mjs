import pg from 'pg';
import crypto from 'crypto';

const client = new pg.Client({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
await client.connect();

const tenantId = '11111111-1111-4111-8111-111111111111';
const partnerId = '00000000-0000-4000-8000-000000000001';
const orgId = '00000000-0000-4000-8000-000000000002';
const branchId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

console.log('Seeding Anaesthesia Records...');
const schedules = (await client.query(`SELECT id, procedure_name, patient_name, patient_id FROM clinical.ot_schedules WHERE tenant_id = $1`, [tenantId])).rows;

for (const s of schedules) {
  const existing = await client.query(`SELECT id FROM clinical.anaesthesia_records WHERE schedule_id = $1`, [s.id]);
  if (existing.rowCount === 0) {
    await client.query(`
      INSERT INTO clinical.anaesthesia_records (
        id, tenant_id, partner_id, organization_id, branch_id,
        schedule_id, patient_id, lead_anaesthetist, anaesthesia_type,
        induction_time, intubation_details, airway_device_used,
        administered_agents_summary, iv_fluids_administered_ml, blood_transfused_units,
        estimated_intraop_blood_loss_ml, intraop_vitals_stability,
        anaesthesia_end_time, extubation_time, intraoperative_complications,
        post_anaesthesia_aldrete_score, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
    `, [
      crypto.randomUUID(), tenantId, partnerId, orgId, branchId,
      s.id, s.patient_id, 'Dr. Vivek Sharma (MD Anaesth)', 'GENERAL_ANAESTHESIA',
      new Date(Date.now() - 7200000), 'Portex 7.5mm Cuffed ETT, Grade 1 Cormack-Lehane View', 'ENDOTRACHEAL_TUBE',
      'Propofol 140mg IV, Fentanyl 100mcg IV, Atracurium 35mg IV, Sevoflurane 2% in O2/Air',
      1200, 0, 80, 'HEMODYNAMICALLY_STABLE',
      new Date(Date.now() - 1800000), new Date(Date.now() - 1500000), 'None reported. Smooth induction and uneventful emergence.',
      10
    ]);
  }
}

console.log('Seeding Ambient AI Scribe Transcripts...');
const scribeData = [
  {
    mrn: 'MRN-772101',
    patientName: 'Sunita Malhotra',
    doctor: 'Dr. Alok Sharma, MBBS, MD',
    specialty: 'Internal Medicine',
    rawTranscript: 'Doctor: Good morning Sunita ji. How have you been feeling since we adjusted your Metformin?\nPatient: Doctor sahab, morning sugars are around 130 now, but feeling mild fatigue by afternoon.\nDoctor: Okay, lets check your HbA1c today and add a mild multivitamin. We will keep Metformin at 500mg twice daily with meals.',
    soap: {
      subjective: '48F follow-up for Type 2 Diabetes Mellitus. Reports improved fasting blood sugar ~130 mg/dL. Complains of afternoon fatigue.',
      objective: 'BP: 126/82 mmHg, Pulse: 74 bpm, BMI: 26.2. Systemic exam: S1S2 heard, chest clear. No peripheral edema.',
      assessment: 'Type 2 Diabetes Mellitus with improved glycemic control. Mild generalized fatigue.',
      plan: '1. Continue Tab Metformin 500mg PO BD after meals. 2. Tab Becozinc 1 PO OD for 30 days. 3. Fasting Blood Sugar & HbA1c re-evaluation in 3 months.'
    },
    icd10: [
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', confidencePct: 96 },
      { code: 'R53.83', description: 'Other fatigue', confidencePct: 84 }
    ],
    prescriptions: [
      { drugName: 'Metformin Hydrochloride 500mg', dosage: '500mg', frequency: 'BD (Twice Daily)', duration: '90 Days' },
      { drugName: 'Becozinc Multivitamin Capsule', dosage: '1 Cap', frequency: 'OD (Once Daily)', duration: '30 Days' }
    ]
  },
  {
    mrn: 'MRN-884102',
    patientName: 'Aarav Singh',
    doctor: 'Dr. Rajesh Sharma, MS (Ortho)',
    specialty: 'Orthopaedics & Joint Replacement',
    rawTranscript: 'Doctor: Aarav, how is the right knee pain after the physio sessions?\nPatient: Walking is better, doctor, but prolonged stairs cause sharp ache in the anterior joint.\nDoctor: Right knee crepitus noted on flexion. X-ray shows Grade II Osteoarthritis. Lets prescribe Aceclofenac SOS and Glucosamine.',
    soap: {
      subjective: '54M presenting with persistent right knee pain exacerbated by stairs and climbing.',
      objective: 'Right knee joint crepitus present. Mild tenderness along medial joint line. No effusion. ROM 0-120 degrees.',
      assessment: 'Primary Osteoarthritis of Right Knee (Kellgren-Lawrence Grade II).',
      plan: '1. Tab Hifenac-P 1 tab PO SOS for acute pain. 2. Tab Tendocare Forte 1 tab PO OD for 60 days. 3. Isometric quadriceps strengthening physiotherapy.'
    },
    icd10: [
      { code: 'M17.11', description: 'Unilateral primary osteoarthritis, right knee', confidencePct: 98 }
    ],
    prescriptions: [
      { drugName: 'Hifenac-P (Aceclofenac + Paracetamol)', dosage: '100mg/325mg', frequency: 'SOS (When Needed)', duration: '10 Days' },
      { drugName: 'Tendocare Forte Tablet', dosage: '1 Tab', frequency: 'OD (Once Daily)', duration: '60 Days' }
    ]
  }
];

for (const item of scribeData) {
  const existing = await client.query(`SELECT id FROM clinical.ambient_ai_scribe_transcripts WHERE tenant_id = $1 AND patient_mrn = $2`, [tenantId, item.mrn]);
  if (existing.rowCount === 0) {
    await client.query(`
      INSERT INTO clinical.ambient_ai_scribe_transcripts (
        id, tenant_id, partner_id, organization_id, branch_id,
        patient_mrn, patient_name, doctor_name, specialty_name,
        encounter_ts, audio_duration_sec, raw_transcript, soap_note,
        suggested_icd10, suggested_prescriptions, review_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    `, [
      crypto.randomUUID(), tenantId, partnerId, orgId, branchId,
      item.mrn, item.patientName, item.doctor, item.specialty,
      new Date(), 210, item.rawTranscript, JSON.stringify(item.soap),
      JSON.stringify(item.icd10), JSON.stringify(item.prescriptions), 'DOCTOR_APPROVED'
    ]);
  }
}

console.log('Seeding Teleconsultation Sessions...');
const teleData = [
  {
    apptNum: 'TELE-2026-9001',
    mrn: 'MRN-772101',
    patientName: 'Sunita Malhotra',
    doctor: 'Dr. Alok Sharma, MD',
    specialty: 'Internal Medicine',
    room: 'ROOM-TELE-ALOK-9001',
    fee: '800.00',
    summary: 'Virtual follow-up for lifestyle glycemic management. Vitals review: BP 124/80 normal. Lab work advised.'
  },
  {
    apptNum: 'TELE-2026-9002',
    mrn: 'MRN-884102',
    patientName: 'Aarav Singh',
    doctor: 'Dr. Rajesh Sharma, MS',
    specialty: 'Orthopaedics',
    room: 'ROOM-TELE-RAJESH-9002',
    fee: '1000.00',
    summary: 'Post-op rehabilitation virtual review. Gait stability confirmed over video stream.'
  }
];

for (const t of teleData) {
  const existing = await client.query(`SELECT id FROM clinical.teleconsultation_sessions WHERE tenant_id = $1 AND webrtc_room_id = $2`, [tenantId, t.room]);
  if (existing.rowCount === 0) {
    await client.query(`
      INSERT INTO clinical.teleconsultation_sessions (
        id, tenant_id, partner_id, organization_id, branch_id,
        appointment_number, patient_mrn, patient_name, doctor_name, specialty_name,
        sched_start_time, actual_start_time, actual_end_time, call_duration_sec,
        webrtc_room_id, status, consultation_fee, payment_status,
        clinical_soap_summary, e_rx_generated, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
    `, [
      crypto.randomUUID(), tenantId, partnerId, orgId, branchId,
      t.apptNum, t.mrn, t.patientName, t.doctor, t.specialty,
      new Date(Date.now() - 3600000), new Date(Date.now() - 3550000), new Date(Date.now() - 2500000), 1050,
      t.room, 'COMPLETED', t.fee, 'PAID',
      t.summary, true
    ]);
  }
}

console.log('Seeding completed successfully!');
await client.end();
