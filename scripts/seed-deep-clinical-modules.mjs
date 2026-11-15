import { getDatabase, sql } from '../packages/database/dist/index.js';

const CANONICAL_TENANT = '11111111-1111-4111-8111-111111111111';

async function main() {
  const db = getDatabase();
  console.log('================================================================');
  console.log('🌱 SEEDING DEEP CLINICAL SUB-MODULE ZERO-ROW TABLES');
  console.log('================================================================\n');

  // 1. Resolve Reference Entities for Canonical Tenant
  console.log('[*] Fetching reference context...');

  const [partnerRow] = (await db.execute(sql`SELECT id FROM clinical.operational_partners WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 1;`)).rows || [];
  const partnerId = partnerRow?.id || '6855be07-5298-4148-a571-c51ac49ac7f3';

  const [orgRow] = (await db.execute(sql`SELECT id FROM clinical.operational_organizations WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 1;`)).rows || [];
  const organizationId = orgRow?.id || '6855be07-5298-4148-a571-c51ac49ac7f3';

  const [facRow] = (await db.execute(sql`SELECT id FROM clinical.operational_facilities WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 1;`)).rows || [];
  const facilityBranchId = facRow?.id || '0f51b2ff-5016-44b6-9b53-f76721298d1d';

  const [coreBranchRow] = (await db.execute(sql`SELECT id FROM core.branches LIMIT 1;`)).rows || [];
  const coreBranchId = coreBranchRow?.id || '16bb1804-f47a-44b0-8594-fb957926caa1';

  const patients = (await db.execute(sql`SELECT id, mrn, first_name, last_name FROM clinical.patients WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 6;`)).rows || [];
  console.log(`  ✓ Found ${patients.length} active patients under canonical tenant`);

  const admissions = (await db.execute(sql`SELECT id, admission_number, patient_id, patient_name, patient_mrn, ward_id, ward_name, bed_id, bed_code, attending_consultant_name, admission_date_time, expected_discharge_date FROM clinical.inpatient_admissions WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 6;`)).rows || [];
  console.log(`  ✓ Found ${admissions.length} inpatient admissions under canonical tenant`);

  const doctors = (await db.execute(sql`SELECT id, doctor_code, primary_specialty FROM clinical.doctor_profiles LIMIT 4;`)).rows || [];
  console.log(`  ✓ Found ${doctors.length} doctor profiles`);

  const schedules = (await db.execute(sql`SELECT id, doctor_id, day_of_week FROM clinical.doctor_schedules WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  console.log(`  ✓ Found ${schedules.length} doctor schedules`);

  const claims = (await db.execute(sql`SELECT id, claim_number, patient_id, total_claim_amount, payer_id FROM clinical.insurance_claims WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 6;`)).rows || [];
  console.log(`  ✓ Found ${claims.length} insurance claims`);

  const vendors = (await db.execute(sql`SELECT id, vendor_code, legal_name, trade_name FROM clinical.procurement_vendors WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  console.log(`  ✓ Found ${vendors.length} vendors`);

  const pos = (await db.execute(sql`SELECT id, po_number, vendor_id, vendor_name FROM clinical.purchase_orders WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  console.log(`  ✓ Found ${pos.length} purchase orders`);

  const grns = (await db.execute(sql`SELECT id, grn_number, purchase_order_id, po_number, vendor_id, vendor_name FROM clinical.goods_receipts WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  console.log(`  ✓ Found ${grns.length} goods receipts`);

  const inWards = (await db.execute(sql`SELECT id, ward_name, ward_code FROM clinical.inpatient_wards WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const inBeds = (await db.execute(sql`SELECT id, bed_code, ward_id FROM clinical.inpatient_beds WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const dispensing = (await db.execute(sql`SELECT id, patient_id FROM clinical.pharmacy_dispensing WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const batches = (await db.execute(sql`SELECT id, medication_id, batch_number FROM clinical.pharmacy_batches WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const medCatalog = (await db.execute(sql`SELECT id, medication_code, generic_name, brand_name FROM clinical.medication_catalog WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const pharmaPrescr = (await db.execute(sql`SELECT id, prescription_number FROM clinical.pharmacy_prescriptions WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const pharmaPrescrItems = (await db.execute(sql`SELECT id, prescription_id, medication_id FROM clinical.pharmacy_prescription_items WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const procItems = (await db.execute(sql`SELECT id, item_code, item_name, standard_cost FROM clinical.procurement_items WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const chargeItems = (await db.execute(sql`SELECT id, description, unit_price FROM clinical.billing_charge_items WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];
  const invoiceItems = (await db.execute(sql`SELECT id, invoice_id, service_code, description, unit_price FROM clinical.billing_invoice_items WHERE tenant_id = ${CANONICAL_TENANT} LIMIT 4;`)).rows || [];

  // Safe reference resolution
  const p1 = patients[0];
  const p2 = patients[1] || p1;
  const adm1 = admissions[0];
  const adm2 = admissions[1] || adm1;
  const doc1 = doctors[0];
  const doc2 = doctors[1] || doc1;
  const sch1 = schedules[0];
  const clm1 = claims[0];
  const clm2 = claims[1] || clm1;
  const vnd1 = vendors[0];
  const po1 = pos[0];
  const grn1 = grns[0];
  const ward1 = inWards[0];
  const ward2 = inWards[1] || ward1;
  const bed1 = inBeds[0];
  const bed2 = inBeds[1] || bed1;
  const disp1 = dispensing[0];
  const batch1 = batches[0];
  const med1 = medCatalog[0];
  const rx1 = pharmaPrescr[0];
  const rxItem1 = pharmaPrescrItems[0];
  const procItem1 = procItems[0];
  const chgItem1 = chargeItems[0];
  const invItem1 = invoiceItems[0];

  // ==============================================================================
  // 1. PHARMACY RETURNS & SUPPLIER LEDGERS (7 Tables)
  // ==============================================================================
  console.log('\n--- 1. Seeding Pharmacy Returns & Supplier Ledgers ---');

  // 1a. clinical.pharmacy_returns
  await db.execute(sql`
    INSERT INTO clinical.pharmacy_returns (
      id, tenant_id, partner_id, organization_id, branch_id,
      return_number, dispensing_id, patient_id, medication_id, batch_id,
      quantity, return_reason, condition, disposition, actor_id, actor_role, notes, occurred_at
    ) VALUES
    (
      '7191f9e8-4a5e-4c97-8676-344c308683a1', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      'PRET-2026-001', ${disp1.id}, ${p1.id}, ${batch1.medication_id || med1.id}, ${batch1.id},
      2, 'PATIENT_DISCHARGE_UNUSED', 'INTACT_SEALED', 'RESTOCK', 'usr_pharma_lead', 'HOSPITAL_PHARMACIST',
      'Unopened medication vials returned upon discharge reconciliation', NOW() - INTERVAL '2 days'
    ),
    (
      '7191f9e8-4a5e-4c97-8676-344c308683a2', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      'PRET-2026-002', ${disp1.id}, ${p2.id}, ${batch1.medication_id || med1.id}, ${batch1.id},
      1, 'ADVERSE_REACTION_SUBSTITUTION', 'OPENED_STRIP', 'QUARANTINE_DISPOSAL', 'usr_pharma_lead', 'HOSPITAL_PHARMACIST',
      'Mild rash reported, switched to alternative. Returned for bio-waste log.', NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.pharmacy_returns');

  // 1b. clinical.pharmacy_stock_adjustments
  await db.execute(sql`
    INSERT INTO clinical.pharmacy_stock_adjustments (
      id, tenant_id, partner_id, organization_id, branch_id,
      adjustment_number, medication_id, batch_id, reason, justification,
      before_quantity, adjustment_quantity, after_quantity, actor_id, actor_role, approved_by, approved_at, occurred_at
    ) VALUES
    (
      '7191f9e8-4a5e-4c97-8676-344c308683b1', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      'ADJ-2026-001', ${batch1.medication_id || med1.id}, ${batch1.id}, 'CYCLE_COUNT_DISCREPANCY',
      'Routine NABH bi-weekly physical inventory count verified in Central Pharmacy Vault B',
      150, -2, 148, 'usr_pharma_auditor', 'PHARMACY_AUDITOR', 'Chief Pharmacist R. Menon', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
    ),
    (
      '7191f9e8-4a5e-4c97-8676-344c308683b2', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      'ADJ-2026-002', ${batch1.medication_id || med1.id}, ${batch1.id}, 'DAMAGED_COLD_CHAIN_TRANSIT',
      'Insulin vial seal hairline fissure observed during unpack inspection',
      60, -1, 59, 'usr_cold_chain_tech', 'STORE_INCHARGE', 'Medical Superintendent Dr. Sharma', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.pharmacy_stock_adjustments');

  // 1c. clinical.vendor_returns
  const vretId = '8191f9e8-4a5e-4c97-8676-344c308683b1';
  await db.execute(sql`
    INSERT INTO clinical.vendor_returns (
      id, tenant_id, partner_id, organization_id, branch_id,
      return_number, vendor_id, vendor_name, goods_receipt_id, grn_number, purchase_order_id, po_number,
      status, total_return_amount, reason, vendor_acknowledgement_ref, credit_note_ref, requested_by, approved_by
    ) VALUES
    (
      ${vretId}, ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      'VRET-2026-001', ${vnd1.id}, ${vnd1.legal_name || 'Sun Pharma Distribution Hub Ltd'}, ${grn1?.id || null}, ${grn1?.grn_number || 'GRN-2026-0044'}, ${po1?.id || null}, ${po1?.po_number || 'PO-2026-0089'},
      'APPROVED', 12500.00, 'Near expiry stock returned under quarterly manufacturer buyback guarantee contract clause 8.3.',
      'ACK-SUN-9901', 'CN-2026-0044', 'Store Incharge Sunil Kumar', 'Head of Procurement Vikas Singhal'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.vendor_returns');

  // 1d. clinical.vendor_return_items
  await db.execute(sql`
    INSERT INTO clinical.vendor_return_items (
      id, tenant_id, vendor_return_id, procurement_item_id, item_code, item_name,
      return_quantity, unit_cost, total_amount, batch_number, serial_number, reason
    ) VALUES
    (
      '8191f9e8-4a5e-4c97-8676-344c308683c1', ${CANONICAL_TENANT}, ${vretId}, ${procItem1.id}, ${procItem1.item_code}, ${procItem1.item_name},
      50, 45.00, 2250.00, 'BAT-CIP-2026-09', 'SN-901-A', 'Manufacturer buyback return'
    ),
    (
      '8191f9e8-4a5e-4c97-8676-344c308683c2', ${CANONICAL_TENANT}, ${vretId}, ${procItem1.id}, ${procItem1.item_code}, ${procItem1.item_name},
      100, 102.50, 10250.00, 'BAT-PAN-2026-11', 'SN-902-B', 'Manufacturer buyback return'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.vendor_return_items');

  // 1e. clinical.pharmacy_stock_reservations
  await db.execute(sql`
    INSERT INTO clinical.pharmacy_stock_reservations (
      id, tenant_id, partner_id, organization_id, branch_id,
      prescription_id, prescription_item_id, medication_id, batch_id,
      reserved_quantity, status, expires_at
    ) VALUES
    (
      '7191f9e8-4a5e-4c97-8676-344c308683d1', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      ${rx1.id}, ${rxItem1.id}, ${batch1.medication_id || med1.id}, ${batch1.id},
      10, 'ACTIVE', NOW() + INTERVAL '24 hours'
    ),
    (
      '7191f9e8-4a5e-4c97-8676-344c308683d2', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      ${rx1.id}, ${rxItem1.id}, ${batch1.medication_id || med1.id}, ${batch1.id},
      4, 'ACTIVE', NOW() + INTERVAL '12 hours'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.pharmacy_stock_reservations');

  // 1f. clinical.supply_chain_stock_ledger
  await db.execute(sql`
    INSERT INTO clinical.supply_chain_stock_ledger (
      id, tenant_id, partner_id, organization_id, branch_id,
      warehouse_id, procurement_item_id, item_code, batch_number, movement_type,
      quantity, balance_before, balance_after, reference_type, reference_id, department_name, performed_by
    ) VALUES
    (
      '7191f9e8-4a5e-4c97-8676-344c308683e1', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      gen_random_uuid(), ${procItem1.id}, ${procItem1.item_code}, 'BAT-MER-2026', 'RECEIPT_FROM_PO',
      200, 50, 250, 'PURCHASE_ORDER', 'PO-2026-0089', 'Central Medical Store', 'Sunil Store Keeper'
    ),
    (
      '7191f9e8-4a5e-4c97-8676-344c308683e2', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      gen_random_uuid(), ${procItem1.id}, ${procItem1.item_code}, 'BAT-MER-2026', 'DISPENSE_TO_WARD',
      -10, 250, 240, 'EMAR_BEDSIDE_DISPENSE', 'EMAR-ORD-8812', 'ICU Post-Op Wing', 'Nurse Preeti'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.supply_chain_stock_ledger');

  // 1g. clinical.pharmacy_audit_traces
  await db.execute(sql`
    INSERT INTO clinical.pharmacy_audit_traces (
      id, tenant_id, partner_id, organization_id, branch_id,
      trace_id, correlation_id, actor_id, actor_role, action, target_entity, target_entity_id,
      prescription_id, patient_id, justification, operation_status, metadata, occurred_at
    ) VALUES
    (
      '7191f9e8-4a5e-4c97-8676-344c308683f1', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      'TRC-PHARM-001', 'CORR-9901', 'usr_pharma_lead', 'HOSPITAL_PHARMACIST', 'VERIFY_DISPENSING',
      'PHARMACY_DISPENSING', 'DISP-2026-01', ${rx1.id}, ${p1.id},
      'High-alert anticoagulant double sign-off completed per NABH PSQ 3',
      'SUCCESS', '{"verifiedWithPhysician": true}'::jsonb, NOW() - INTERVAL '4 hours'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.pharmacy_audit_traces');

  // ==============================================================================
  // 2. TPA CLAIMS ADJUDICATION & APPEALS (5 Tables)
  // ==============================================================================
  console.log('\n--- 2. Seeding TPA Claims Adjudication & Appeals ---');

  // 2a. clinical.insurance_claim_items
  const claimItemId = 'a191f9e8-4a5e-4c97-8676-344c308683bb';
  await db.execute(sql`
    INSERT INTO clinical.insurance_claim_items (
      id, tenant_id, claim_id, invoice_item_id, charge_item_id, service_code, service_description,
      quantity, unit_price, billed_amount, allowed_amount, approved_amount, denied_amount, patient_responsibility, status
    ) VALUES
    (
      ${claimItemId}, ${CANONICAL_TENANT}, ${clm1.id}, ${invItem1.id}, ${chgItem1.id}, 'SRV-ICU-DAY', 'Intensive Critical Care Bed & Telemetry Monitoring (Per Diem)',
      3, 15000.00, 45000.00, 45000.00, 45000.00, 0.00, 0.00, 'APPROVED'
    ),
    (
      'a191f9e8-4a5e-4c97-8676-344c308683bc', ${CANONICAL_TENANT}, ${clm2.id}, ${invItem1.id}, ${chgItem1.id}, 'SRV-SURG-PTCA', 'Emergency Percutaneous Transluminal Coronary Angioplasty',
      1, 35000.00, 35000.00, 0.00, 0.00, 35000.00, 0.00, 'DENIED'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.insurance_claim_items');

  // 2b. clinical.insurance_claim_adjudications
  await db.execute(sql`
    INSERT INTO clinical.insurance_claim_adjudications (
      id, tenant_id, claim_id, adjudication_reference, adjudication_status,
      total_billed, approved_amount, denied_amount, patient_responsibility, contractual_adjustment,
      payer_remarks, eob_document_url, adjudicated_at, adjudicated_by
    ) VALUES
    (
      '9191f9e8-4a5e-4c97-8676-344c308683a1', ${CANONICAL_TENANT}, ${clm1.id}, 'ADJ-STAR-2026-901', 'APPROVED',
      92000.00, 82000.00, 10000.00, 10000.00, 0.00,
      'Pre-auth cashless approved under GIPSA standard procedure rates. Non-medical consumables Rs 10000 co-pay.',
      'https://documents.docsearch.health/eob/eob-2026-901.pdf', NOW() - INTERVAL '1 day', 'Dr. S. Nair (Star Health TPA Medical Desk)'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.insurance_claim_adjudications');

  // 2c. clinical.insurance_claim_denials
  const denialId = '9191f9e8-4a5e-4c97-8676-344c308683b2';
  await db.execute(sql`
    INSERT INTO clinical.insurance_claim_denials (
      id, tenant_id, claim_id, claim_item_id, denial_number, denial_code, denial_category,
      denial_reason, denied_amount, appeal_eligible, appeal_deadline, status
    ) VALUES
    (
      ${denialId}, ${CANONICAL_TENANT}, ${clm2.id}, ${claimItemId}, 'DEN-2026-0042', 'DEN-DOC-401', 'DOCUMENTATION_DEFICIT',
      'Initial surgical operative notes and intra-operative imaging fluoroscopy recording missing from submission packet.',
      35000.00, true, NOW() + INTERVAL '30 days', 'OPEN'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.insurance_claim_denials');

  // 2d. clinical.insurance_claim_appeals
  await db.execute(sql`
    INSERT INTO clinical.insurance_claim_appeals (
      id, tenant_id, claim_id, denial_id, appeal_number, appeal_level,
      appeal_reason, supporting_documents_summary, submitted_at, submitted_by, status, outcome_notes, recovered_amount
    ) VALUES
    (
      '9191f9e8-4a5e-4c97-8676-344c308683a3', ${CANONICAL_TENANT}, ${clm2.id}, ${denialId}, 'APL-2026-0018', 1,
      'Operative notes signed by Lead Surgeon Dr. Rajesh Sharma and PACS fluoroscopy timestamped DICOM attached.',
      'Operative summary, Orthanc PACS study link, Attending Physician emergency justification certificate',
      NOW() - INTERVAL '6 hours', 'Hospital TPA Desk - Anil Sharma', 'UNDER_REVIEW', 'Awaiting TPA Re-adjudication Committee response', 0.00
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.insurance_claim_appeals');

  // 2e. clinical.insurance_settlements
  await db.execute(sql`
    INSERT INTO clinical.insurance_settlements (
      id, tenant_id, partner_id, organization_id, branch_id, payer_id, claim_id,
      settlement_reference, eft_transaction_number, settlement_amount, settlement_date, status, payment_reference, recorded_by
    ) VALUES
    (
      '9191f9e8-4a5e-4c97-8676-344c308683a4', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId}, ${clm1.payer_id}, ${clm1.id},
      'SETTL-STAR-8812', 'NEFT-HDFC-991823412', 82000.00, NOW() - INTERVAL '12 hours', 'RECEIVED', 'UTRN-STAR-2026-9901', 'Accounts Desk - Meena Iyer'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.insurance_settlements');

  // ==============================================================================
  // 3. INPATIENT DISCHARGE & TRANSFER REQUESTS (5 Tables)
  // ==============================================================================
  console.log('\n--- 3. Seeding Inpatient Discharge & Transfer Requests ---');

  // 3a. clinical.inpatient_discharge_plans
  await db.execute(sql`
    INSERT INTO clinical.inpatient_discharge_plans (
      id, tenant_id, partner_id, organization_id, branch_id,
      admission_id, patient_id, target_discharge_date, readiness_status,
      is_medication_reconciled, is_nursing_care_handover_done, is_billing_cleared, is_insurance_pre_approved, is_discharge_summary_finalized,
      transport_arrangement, patient_education_summary, follow_up_instructions, coordinator_name
    ) VALUES
    (
      'a191f9e8-4a5e-4c97-8676-344c308683d1', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${coreBranchId},
      ${adm1.id}, ${adm1.patient_id || p1.id}, NOW() + INTERVAL '2 days', 'DISCHARGE_PENDING_AUDIT',
      true, true, false, true, false,
      'FAMILY_CAR', 'Post-angioplasty physical exertion guidelines and dual-antiplatelet adherence explained to family.',
      'Cardiology OPD follow-up in 7 days with repeat ECG and lipid profile.', 'Nurse Incharge Rashmi Patel'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.inpatient_discharge_plans');

  // 3b. clinical.inpatient_discharge_requests
  await db.execute(sql`
    INSERT INTO clinical.inpatient_discharge_requests (
      id, tenant_id, partner_id, organization_id, branch_id,
      request_number, admission_id, patient_id, requesting_doctor_name,
      discharge_type, condition_at_discharge, clinical_clearance, clinical_clearance_doctor,
      financial_clearance, financial_clearance_officer, insurance_clearance, insurance_clearance_ref,
      pharmacy_med_discharged, status, discharge_authorized_by, authorized_at
    ) VALUES
    (
      'a191f9e8-4a5e-4c97-8676-344c308683d2', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${coreBranchId},
      'DCR-2026-0041', ${adm1.id}, ${adm1.patient_id || p1.id}, ${adm1.attending_consultant_name || 'Dr. Rajesh Sharma'},
      'NORMAL', 'HEMODYNAMICALLY_STABLE', true, ${adm1.attending_consultant_name || 'Dr. Rajesh Sharma'},
      true, 'Billing Lead Meena Iyer', true, 'TPA-PREAUTH-STAR-99',
      true, 'APPROVED', 'Medical Superintendent Dr. V. Sharma', NOW() - INTERVAL '2 hours'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.inpatient_discharge_requests');

  // 3c. clinical.inpatient_discharge_summaries
  await db.execute(sql`
    INSERT INTO clinical.inpatient_discharge_summaries (
      id, tenant_id, partner_id, organization_id, branch_id,
      summary_number, admission_id, patient_id, patient_name, patient_mrn,
      admission_date, discharge_date, attending_consultant_name, final_primary_diagnosis,
      hospital_course_summary, treatment_given, discharge_medication_advice, diet_and_activity_advice,
      warning_signs_to_seek_immediate_care, is_finalized, finalized_by, finalized_at, version_number
    ) VALUES
    (
      'a191f9e8-4a5e-4c97-8676-344c308683d3', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${coreBranchId},
      'DSUM-2026-0012', ${adm1.id}, ${adm1.patient_id || p1.id}, ${adm1.patient_name || 'Amit Reddy'}, ${adm1.patient_mrn || 'UHID-2026-0023'},
      NOW() - INTERVAL '4 days', NOW(), ${adm1.attending_consultant_name || 'Dr. Rajesh Sharma'},
      'Coronary Artery Disease - Acute Inferior Wall STEMI (Post-Primary PTCA with Drug Eluting Stent to RCA)',
      'Patient admitted via ER with acute chest pain and diaphoresis. Coronary angiography revealed 99% thrombotic occlusion of mid RCA. Successful primary angioplasty performed with DES. ICU stay uneventful. Hemodynamically stable.',
      'Aspirin 75mg OD, Ticagrelor 90mg BD, Atorvastatin 80mg HS, Metoprolol 25mg OD',
      'Take all prescribed antiplatelets without missing any doses. Do not discontinue without consulting cardiologist.',
      'Low salt, low fat cardiac diet. Light walking allowed. Avoid lifting heavy objects for 2 weeks.',
      'Recurrent chest heaviness, severe shortness of breath, unexplained cold sweats, or bleeding from gums/urine.',
      true, ${adm1.attending_consultant_name || 'Dr. Rajesh Sharma'}, NOW() - INTERVAL '1 hour', 1
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.inpatient_discharge_summaries');

  // 3d. clinical.inpatient_transfers
  const trfId = 'a191f9e8-4a5e-4c97-8676-344c308683b3';
  await db.execute(sql`
    INSERT INTO clinical.inpatient_transfers (
      id, tenant_id, partner_id, organization_id, branch_id,
      transfer_number, admission_id, patient_id, patient_name, patient_mrn,
      source_ward_id, source_ward_name, source_bed_id, source_bed_code,
      destination_ward_id, destination_ward_name, destination_bed_id, destination_bed_code,
      transfer_type, priority, transfer_reason, requesting_doctor_name, transport_requirement, status, requested_at, approved_at
    ) VALUES
    (
      ${trfId}, ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${coreBranchId},
      'TRF-2026-0019', ${adm1.id}, ${adm1.patient_id || p1.id}, ${adm1.patient_name || 'Amit Reddy'}, ${adm1.patient_mrn || 'UHID-2026-0023'},
      ${ward1.id}, ${ward1.ward_name}, ${bed1.id}, ${bed1.bed_code},
      ${ward2.id}, ${ward2.ward_name}, ${bed2.id}, ${bed2.bed_code},
      'STEP_DOWN', 'ROUTINE',
      'Post-op Day 3 clinical stability. Vitals stable on room air. Step down from ICU to step-down ward bed.',
      ${adm1.attending_consultant_name || 'Dr. Rajesh Sharma'}, 'STRETCHER_TROLLEY', 'APPROVED', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.inpatient_transfers');

  // 3e. clinical.inpatient_transfer_approvals
  await db.execute(sql`
    INSERT INTO clinical.inpatient_transfer_approvals (
      id, tenant_id, partner_id, organization_id, branch_id,
      transfer_id, approver_name, approver_role, decision, justification, timestamp
    ) VALUES
    (
      'a191f9e8-4a5e-4c97-8676-344c308683d4', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${coreBranchId},
      ${trfId}, 'Dr. V. Sharma', 'HOSPITAL_REGISTRAR', 'APPROVED',
      'Bed SD-12 sterilized and available in Step-Down Cardiac Ward. ICU bed liberated for emergency trauma admission.',
      NOW() - INTERVAL '4 hours'
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.inpatient_transfer_approvals');

  // ==============================================================================
  // 4. DOCTOR LEAVE & SHIFT BREAKS (2 Tables)
  // ==============================================================================
  console.log('\n--- 4. Seeding Doctor Leave & Shift Breaks ---');

  // 4a. clinical.doctor_leaves
  await db.execute(sql`
    INSERT INTO clinical.doctor_leaves (
      id, tenant_id, partner_id, organization_id, branch_id,
      doctor_id, leave_type, start_date, end_date, reason,
      approval_status, approved_by, affected_slots_count, metadata
    ) VALUES
    (
      'd191f9e8-4a5e-4c97-8676-344c308683e1', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      ${doc1.id}, 'CONFERENCE_LEAVE', NOW() + INTERVAL '10 days', NOW() + INTERVAL '14 days',
      'Annual Cardiological Society of India (CSI 2026) Scientific Conference - Panel Speaker',
      'APPROVED', 'Medical Director Dr. K. N. Rao', 32, '{"notes": "Cardiological Society speaker invitation"}'::jsonb
    ),
    (
      'd191f9e8-4a5e-4c97-8676-344c308683e2', ${CANONICAL_TENANT}, ${partnerId}, ${organizationId}, ${facilityBranchId},
      ${doc2.id}, 'CASUAL_LEAVE', NOW() + INTERVAL '20 days', NOW() + INTERVAL '21 days',
      'Family personal commitment',
      'APPROVED', 'Medical Director Dr. K. N. Rao', 16, '{}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.doctor_leaves');

  // 4b. clinical.doctor_schedule_breaks
  await db.execute(sql`
    INSERT INTO clinical.doctor_schedule_breaks (
      id, tenant_id, partner_id, schedule_id, break_name, start_time, end_time, metadata
    ) VALUES
    (
      'd191f9e8-4a5e-4c97-8676-344c308683e3', ${CANONICAL_TENANT}, ${partnerId}, ${sch1.id}, 'LUNCH_BREAK', '13:00', '14:00',
      '{"chamberReserved": true}'::jsonb
    ),
    (
      'd191f9e8-4a5e-4c97-8676-344c308683e4', ${CANONICAL_TENANT}, ${partnerId}, ${sch1.id}, 'TEA_BREAK', '16:30', '16:45',
      '{"chamberReserved": false}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('  ✓ Seeded clinical.doctor_schedule_breaks');

  console.log('\n================================================================');
  console.log('✅ ALL TARGET CLINICAL SUB-MODULE TABLES SUCCESSFULLY SEEDED!');
  console.log('================================================================');
}

main().catch(console.error).then(() => process.exit(0));
