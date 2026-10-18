import pg from 'pg';
import crypto from 'node:crypto';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';

async function seed() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('[*] Connected to PostgreSQL for Seeding Master Data...');

  // 1. Fetch default tenant, partner, org, facility, patient
  const tenantRes = await client.query('SELECT id FROM core.tenants LIMIT 1');
  if (tenantRes.rows.length === 0) {
    console.error('No tenants found in core.tenants');
    await client.end();
    return;
  }
  const tenantId = tenantRes.rows[0].id;

  const partnerRes = await client.query('SELECT id FROM clinical.operational_partners WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  const partnerId = partnerRes.rows[0]?.id || tenantId;

  const orgRes = await client.query('SELECT id FROM clinical.operational_organizations WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  const organizationId = orgRes.rows[0]?.id || tenantId;

  let facRes = await client.query('SELECT id FROM clinical.operational_facilities WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  let branchId = facRes.rows[0]?.id;
  if (!branchId) {
    const newFac = await client.query(`
      INSERT INTO clinical.operational_facilities (
        tenant_id, partner_id, organization_id, facility_code, facility_name, facility_type, address_street, address_city, address_state, address_postal_code, contact_email, contact_phone, status
      ) VALUES ($1, $2, $3, 'FAC-MAIN-001', 'DocSearch Central Hospital', 'INPATIENT_HOSPITAL', 'Sector 44, Institutional Area', 'Gurugram', 'Haryana', '122003', 'hospital@docsearch.in', '+91-124-4567890', 'ACTIVE')
      RETURNING id;
    `, [tenantId, partnerId, organizationId]);
    branchId = newFac.rows[0].id;
    console.log(`[✔] Created Operational Facility: FAC-MAIN-001 (${branchId})`);
  }

  const patRes = await client.query('SELECT id FROM clinical.patients WHERE tenant_id = $1 LIMIT 2', [tenantId]);
  let patient1Id = patRes.rows[0]?.id;
  let patient2Id = patRes.rows[1]?.id;

  if (!patient1Id) {
    const newPat = await client.query(`
      INSERT INTO clinical.patients (tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code, first_name, last_name, date_of_birth, gender)
      VALUES ($1, $2, $3, $4, 'UHID-2026-0001', 'MRN-2026-0001', 'PAT-0001', 'Rajesh', 'Kumar', '1985-05-15', 'MALE')
      RETURNING id;
    `, [tenantId, partnerId, organizationId, branchId]);
    patient1Id = newPat.rows[0].id;
    console.log(`[✔] Created Patient: Rajesh Kumar (${patient1Id})`);
  }
  if (!patient2Id) {
    const newPat = await client.query(`
      INSERT INTO clinical.patients (tenant_id, partner_id, organization_id, branch_id, uhid, mrn, patient_code, first_name, last_name, date_of_birth, gender)
      VALUES ($1, $2, $3, $4, 'UHID-2026-0002', 'MRN-2026-0002', 'PAT-0002', 'Sunita', 'Devi', '1990-08-20', 'FEMALE')
      RETURNING id;
    `, [tenantId, partnerId, organizationId, branchId]);
    patient2Id = newPat.rows[0].id;
    console.log(`[✔] Created Patient: Sunita Devi (${patient2Id})`);
  }

  console.log(`[+] Seed Context: Tenant=${tenantId}, Partner=${partnerId}, Facility=${branchId}`);

  // =========================================================================
  // SEED OPTION A: INSURANCE MASTER DATA
  // =========================================================================
  console.log('\n--- Seeding Option A: Insurance & Claims Management ---');

  // 1. Payers
  const payers = [
    {
      code: 'PAY-STAR-001',
      name: 'Star Health & Allied Insurance Co.',
      type: 'COMMERCIAL_INSURANCE',
      tpa: 'Medi Assist Healthcare TPA',
      email: 'cashless@starhealth.in',
      phone: '+91-1800-425-2255'
    },
    {
      code: 'PAY-ICICI-002',
      name: 'ICICI Lombard General Insurance',
      type: 'COMMERCIAL_INSURANCE',
      tpa: 'Vidal Health TPA Services',
      email: 'preauth@icicilombard.com',
      phone: '+91-1800-2666'
    },
    {
      code: 'PAY-NIVA-003',
      name: 'Niva Bupa Health Insurance Ltd',
      type: 'COMMERCIAL_INSURANCE',
      tpa: 'Paramount Health Services TPA',
      email: 'claims@nivabupa.com',
      phone: '+91-1800-309-3333'
    },
    {
      code: 'PAY-PMJAY-004',
      name: 'Ayushman Bharat PM-JAY Scheme',
      type: 'GOVERNMENT_HEALTHCARE',
      tpa: 'National Health Authority (NHA)',
      email: 'support@pmjay.gov.in',
      phone: '14555'
    }
  ];

  const payerIds = {};
  for (const p of payers) {
    const existing = await client.query('SELECT id FROM clinical.insurance_payers WHERE tenant_id = $1 AND payer_code = $2', [tenantId, p.code]);
    if (existing.rows.length === 0) {
      const ins = await client.query(`
        INSERT INTO clinical.insurance_payers (
          tenant_id, partner_id, organization_id, branch_id, payer_code, payer_name, payer_type, tpa_name, contact_email, contact_phone, claim_submission_mode, settlement_period_days, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'EDI_ELECTRONIC', 30, 'ACTIVE')
        RETURNING id;
      `, [tenantId, partnerId, organizationId, branchId, p.code, p.name, p.type, p.tpa, p.email, p.phone]);
      payerIds[p.code] = ins.rows[0].id;
      console.log(`[✔] Inserted Payer: ${p.name}`);
    } else {
      payerIds[p.code] = existing.rows[0].id;
      console.log(`[-] Payer already exists: ${p.name}`);
    }
  }

  // 2. Plans
  const plans = [
    {
      payerCode: 'PAY-STAR-001',
      code: 'PLAN-STAR-GOLD',
      name: 'Star Comprehensive Platinum Gold',
      type: 'COMPREHENSIVE',
      copay: '0.00',
      preAuthThreshold: '5000.00'
    },
    {
      payerCode: 'PAY-ICICI-002',
      code: 'PLAN-ICICI-SHIELD',
      name: 'ICICI Health Shield 360',
      type: 'COMPREHENSIVE',
      copay: '5.00',
      preAuthThreshold: '10000.00'
    },
    {
      payerCode: 'PAY-PMJAY-004',
      code: 'PLAN-PMJAY-NAT',
      name: 'PM-JAY National Health Protection Coverage',
      type: 'GOVERNMENT_HEALTHCARE',
      copay: '0.00',
      preAuthThreshold: '0.00'
    }
  ];

  const planIds = {};
  for (const pl of plans) {
    const payerId = payerIds[pl.payerCode];
    if (!payerId) continue;
    const existing = await client.query('SELECT id FROM clinical.insurance_plans WHERE tenant_id = $1 AND plan_code = $2', [tenantId, pl.code]);
    if (existing.rows.length === 0) {
      const ins = await client.query(`
        INSERT INTO clinical.insurance_plans (
          tenant_id, partner_id, organization_id, payer_id, plan_code, plan_name, plan_type, network_type, copay_percentage, standard_deductible, pre_auth_threshold, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'TIER_1_IN_NETWORK', $8, '0.00', $9, 'ACTIVE')
        RETURNING id;
      `, [tenantId, partnerId, organizationId, payerId, pl.code, pl.name, pl.type, pl.copay, pl.preAuthThreshold]);
      planIds[pl.code] = ins.rows[0].id;
      console.log(`[✔] Inserted Plan: ${pl.name}`);
    } else {
      planIds[pl.code] = existing.rows[0].id;
      console.log(`[-] Plan already exists: ${pl.name}`);
    }
  }

  // 3. Patient Policies
  const policies = [
    {
      patientId: patient1Id,
      payerCode: 'PAY-STAR-001',
      planCode: 'PLAN-STAR-GOLD',
      memberId: 'MEM-STAR-8812',
      policyNumber: 'STAR-IND-9872134',
      subscriberName: 'Rajesh Kumar',
      relationship: 'SELF'
    },
    {
      patientId: patient2Id,
      payerCode: 'PAY-ICICI-002',
      planCode: 'PLAN-ICICI-SHIELD',
      memberId: 'MEM-ICICI-4401',
      policyNumber: 'ICICI-GRP-4412980',
      subscriberName: 'Sunita Devi',
      relationship: 'SELF'
    }
  ];

  const policyIds = [];
  for (const pol of policies) {
    const payerId = payerIds[pol.payerCode];
    const planId = planIds[pol.planCode];
    if (!payerId || !planId) continue;
    const existing = await client.query('SELECT id FROM clinical.insurance_patient_policies WHERE tenant_id = $1 AND policy_number = $2', [tenantId, pol.policyNumber]);
    if (existing.rows.length === 0) {
      const ins = await client.query(`
        INSERT INTO clinical.insurance_patient_policies (
          tenant_id, partner_id, organization_id, branch_id, patient_id, payer_id, plan_id, member_id, policy_number, subscriber_name, subscriber_relationship, coverage_status, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE', 'VERIFIED')
        RETURNING id;
      `, [tenantId, partnerId, organizationId, branchId, pol.patientId, payerId, planId, pol.memberId, pol.policyNumber, pol.subscriberName, pol.relationship]);
      policyIds.push(ins.rows[0].id);
      console.log(`[✔] Inserted Patient Policy: ${pol.policyNumber} (${pol.subscriberName})`);
    } else {
      policyIds.push(existing.rows[0].id);
      console.log(`[-] Policy already exists: ${pol.policyNumber}`);
    }
  }

  // 4. Authorizations (Pre-Auths)
  const auths = [
    {
      authNumber: 'AUTH-2026-0081',
      patientId: patient1Id,
      payerCode: 'PAY-STAR-001',
      policyId: policyIds[0],
      diagnosisContext: 'Calculus of gallbladder without cholecystitis (K80.20)',
      requestedServices: 'Laparoscopic Cholecystectomy with General Anesthesia & ICU stay',
      requestedAmount: '85000.00',
      approvedAmount: '75000.00',
      status: 'APPROVED'
    },
    {
      authNumber: 'AUTH-2026-0082',
      patientId: patient2Id,
      payerCode: 'PAY-ICICI-002',
      policyId: policyIds[1],
      diagnosisContext: 'Unilateral primary osteoarthritis, right knee (M17.11)',
      requestedServices: 'Total Knee Replacement (TKR) with Bi-Cruciate Retaining Implant',
      requestedAmount: '220000.00',
      approvedAmount: '0.00',
      status: 'SUBMITTED'
    }
  ];

  const authIds = {};
  for (const a of auths) {
    const payerId = payerIds[a.payerCode];
    const existing = await client.query('SELECT id FROM clinical.insurance_authorizations WHERE tenant_id = $1 AND authorization_number = $2', [tenantId, a.authNumber]);
    if (existing.rows.length === 0) {
      const ins = await client.query(`
        INSERT INTO clinical.insurance_authorizations (
          tenant_id, partner_id, organization_id, branch_id, patient_id, payer_id, policy_id, authorization_number, diagnosis_context, requested_services, requested_amount, approved_amount, status, submitted_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Dr. Arvind Sharma (Chief Surgeon)')
        RETURNING id;
      `, [tenantId, partnerId, organizationId, branchId, a.patientId, payerId, a.policyId, a.authNumber, a.diagnosisContext, a.requestedServices, a.requestedAmount, a.approvedAmount, a.status]);
      authIds[a.authNumber] = ins.rows[0].id;
      console.log(`[✔] Inserted Authorization: ${a.authNumber} [${a.status}]`);
    } else {
      authIds[a.authNumber] = existing.rows[0].id;
      console.log(`[-] Authorization already exists: ${a.authNumber}`);
    }
  }

  // 5. Insurance Claims
  const claims = [
    {
      claimNumber: 'CLM-2026-0019',
      patientId: patient1Id,
      payerCode: 'PAY-STAR-001',
      policyId: policyIds[0],
      authNumber: 'AUTH-2026-0081',
      totalAmount: '92000.00',
      approvedAmount: '84500.00',
      patientResponsibility: '7500.00',
      status: 'APPROVED',
      diagnosisCode: 'K80.20',
      diagnosisDesc: 'Calculus of gallbladder without cholecystitis'
    },
    {
      claimNumber: 'CLM-2026-0020',
      patientId: patient2Id,
      payerCode: 'PAY-ICICI-002',
      policyId: policyIds[1],
      authNumber: 'AUTH-2026-0082',
      totalAmount: '34000.00',
      approvedAmount: '0.00',
      patientResponsibility: '0.00',
      status: 'SUBMITTED',
      diagnosisCode: 'M17.11',
      diagnosisDesc: 'Unilateral primary osteoarthritis, right knee'
    }
  ];

  for (const c of claims) {
    const payerId = payerIds[c.payerCode];
    const authId = authIds[c.authNumber] || null;
    const existing = await client.query('SELECT id FROM clinical.insurance_claims WHERE tenant_id = $1 AND claim_number = $2', [tenantId, c.claimNumber]);
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO clinical.insurance_claims (
          tenant_id, partner_id, organization_id, branch_id, patient_id, payer_id, policy_id, authorization_id, claim_number, claim_type, total_claim_amount, approved_amount, denied_amount, patient_responsibility, status, primary_diagnosis_code, primary_diagnosis_description, submitted_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'INPATIENT', $10, $11, '0.00', $12, $13, $14, $15, 'Billing Executive (TPA Desk)')
      `, [tenantId, partnerId, organizationId, branchId, c.patientId, payerId, c.policyId, authId, c.claimNumber, c.totalAmount, c.approvedAmount, c.patientResponsibility, c.status, c.diagnosisCode, c.diagnosisDesc]);
      console.log(`[✔] Inserted Claim: ${c.claimNumber} [${c.status}]`);
    } else {
      console.log(`[-] Claim already exists: ${c.claimNumber}`);
    }
  }

  // =========================================================================
  // SEED OPTION B: B2B WHOLESALE & PROCUREMENT MASTER DATA
  // =========================================================================
  console.log('\n--- Seeding Option B: B2B Wholesale / Procurement ---');

  // 1. Vendors
  const vendors = [
    {
      code: 'VND-SUN-001',
      legalName: 'Sun Pharma Distribution Hub Ltd',
      tradeName: 'Sun Pharma Institutional',
      category: 'PHARMACEUTICALS',
      type: 'MANUFACTURER',
      gst: '27AABCS1429B1Z8',
      person: 'Vikram Mehra',
      email: 'orders.mumbai@sunpharma.com',
      phone: '+91-22-4324-4324',
      rating: '4.90',
      slaHours: 24
    },
    {
      code: 'VND-CIP-002',
      legalName: 'Cipla Institutional Healthcare Logistics',
      tradeName: 'Cipla Care B2B',
      category: 'PHARMACEUTICALS',
      type: 'DISTRIBUTOR',
      gst: '27AACCC4992K1Z2',
      person: 'Dr. Anita Desai',
      email: 'institutional@cipla.com',
      phone: '+91-22-2482-6000',
      rating: '4.80',
      slaHours: 48
    },
    {
      code: 'VND-TRA-003',
      legalName: 'Transasia Bio-Medicals Ltd',
      tradeName: 'Transasia Diagnostics',
      category: 'LABORATORY_REAGENTS',
      type: 'MANUFACTURER',
      gst: '27AABCT2319P1ZW',
      person: 'Suresh Nambiar',
      email: 'reagents@transasia.co.in',
      phone: '+91-22-4030-9000',
      rating: '4.70',
      slaHours: 48
    },
    {
      code: 'VND-BD-004',
      legalName: 'Becton Dickinson India Medical Devices',
      tradeName: 'BD Healthcare Solutions',
      category: 'SURGICAL_DISPOSABLES',
      type: 'DIRECT_IMPORTER',
      gst: '07AAACB2586L1Z4',
      person: 'Rajiv Chawla',
      email: 'bd_institutional_india@bd.com',
      phone: '+91-124-3949-000',
      rating: '4.85',
      slaHours: 36
    }
  ];

  const vendorIds = {};
  for (const v of vendors) {
    const existing = await client.query('SELECT id FROM clinical.procurement_vendors WHERE tenant_id = $1 AND vendor_code = $2', [tenantId, v.code]);
    if (existing.rows.length === 0) {
      const ins = await client.query(`
        INSERT INTO clinical.procurement_vendors (
          tenant_id, partner_id, organization_id, branch_id, vendor_code, legal_name, trade_name, vendor_category, vendor_type, gst_number, contact_person, contact_email, contact_phone, rating, delivery_sla_hours, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'ACTIVE')
        RETURNING id;
      `, [tenantId, partnerId, organizationId, branchId, v.code, v.legalName, v.tradeName, v.category, v.type, v.gst, v.person, v.email, v.phone, v.rating, v.slaHours]);
      vendorIds[v.code] = ins.rows[0].id;
      console.log(`[✔] Inserted Vendor: ${v.legalName} (${v.code})`);
    } else {
      vendorIds[v.code] = existing.rows[0].id;
      console.log(`[-] Vendor already exists: ${v.legalName}`);
    }
  }

  // 2. Procurement Items Catalog
  const items = [
    {
      code: 'ITEM-MED-001',
      name: 'Paracetamol 650mg IV Infusion 100ml',
      category: 'MEDICINE',
      unit: 'VIAL',
      cost: '34.50',
      reorderLevel: 100,
      safetyStock: 30,
      leadTimeDays: 2
    },
    {
      code: 'ITEM-MED-002',
      name: 'Meropenem 1g Sterile Injection Powder',
      category: 'MEDICINE',
      unit: 'VIAL',
      cost: '480.00',
      reorderLevel: 50,
      safetyStock: 15,
      leadTimeDays: 3
    },
    {
      code: 'ITEM-DISP-003',
      name: 'BD Nexiva Closed IV Catheter System 20G',
      category: 'SURGICAL_CONSUMABLE',
      unit: 'PACK',
      cost: '145.00',
      reorderLevel: 200,
      safetyStock: 50,
      leadTimeDays: 2
    },
    {
      code: 'ITEM-LAB-004',
      name: 'Transasia Erba XL Bilirubin Reagent Kit 4x50ml',
      category: 'LAB_REAGENT',
      unit: 'KIT',
      cost: '1850.00',
      reorderLevel: 10,
      safetyStock: 3,
      leadTimeDays: 4
    },
    {
      code: 'ITEM-PPE-005',
      name: '3-Ply Surgical Face Masks Type IIR (Box of 50)',
      category: 'PPE_SUPPLY',
      unit: 'BOX',
      cost: '120.00',
      reorderLevel: 50,
      safetyStock: 20,
      leadTimeDays: 2
    }
  ];

  for (const it of items) {
    const existing = await client.query('SELECT id FROM clinical.procurement_items WHERE tenant_id = $1 AND item_code = $2', [tenantId, it.code]);
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO clinical.procurement_items (
          tenant_id, partner_id, organization_id, branch_id, item_code, item_name, category, unit, standard_cost, reorder_level, safety_stock, lead_time_days, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE')
      `, [tenantId, partnerId, organizationId, branchId, it.code, it.name, it.category, it.unit, it.cost, it.reorderLevel, it.safetyStock, it.leadTimeDays]);
      console.log(`[✔] Inserted Procurement Item: ${it.name} (${it.code})`);
    } else {
      console.log(`[-] Item already exists: ${it.name}`);
    }
  }

  // 3. Purchase Requisitions & Purchase Orders
  const existingPR = await client.query('SELECT id FROM clinical.purchase_requisitions WHERE tenant_id = $1 AND requisition_number = $2', [tenantId, 'PR-2026-0142']);
  let prId;
  if (existingPR.rows.length === 0) {
    const prRes = await client.query(`
      INSERT INTO clinical.purchase_requisitions (
        tenant_id, partner_id, organization_id, branch_id, requisition_number, department_name, store_name, priority, reason, justification, total_estimated_amount, required_by_date, status, requested_by
      ) VALUES ($1, $2, $3, $4, 'PR-2026-0142', 'Central Emergency Pharmacy', 'Main Medical Store', 'URGENT', 'Critical emergency ICU restock of antibiotics and infusion fluids', 'Approved by Clinical Pharmacy Committee', '145000.00', NOW() + INTERVAL '2 DAYS', 'APPROVED', 'Pharmacist In-Charge')
      RETURNING id;
    `, [tenantId, partnerId, organizationId, branchId]);
    prId = prRes.rows[0].id;
    console.log('[✔] Inserted Purchase Requisition: PR-2026-0142');
  } else {
    prId = existingPR.rows[0].id;
  }

  const existingPO = await client.query('SELECT id FROM clinical.purchase_orders WHERE tenant_id = $1 AND po_number = $2', [tenantId, 'PO-2026-0089']);
  if (existingPO.rows.length === 0) {
    const vendorId = vendorIds['VND-SUN-001'];
    await client.query(`
      INSERT INTO clinical.purchase_orders (
        tenant_id, partner_id, organization_id, branch_id, po_number, requisition_id, vendor_id, vendor_name, delivery_location, expected_delivery_date, payment_terms, total_gross_amount, total_tax_amount, total_net_amount, status
      ) VALUES ($1, $2, $3, $4, 'PO-2026-0089', $5, $6, 'Sun Pharma Distribution Hub Ltd', 'Central Medical Store, Basement Wing B, DocSearch Hospital', NOW() + INTERVAL '1 DAY', 'NET_30', '145000.00', '17400.00', '162400.00', 'APPROVED')
    `, [tenantId, partnerId, organizationId, branchId, prId, vendorId]);
    console.log('[✔] Inserted Purchase Order: PO-2026-0089');
  }

  // 4. Procurement Audit Traces
  await client.query(`
    INSERT INTO clinical.procurement_audit_traces (
      tenant_id, partner_id, organization_id, branch_id, trace_id, actor_id, actor_role, operation, entity_type, entity_id, reason, hash_pointer
    ) VALUES (
      $1, $2, $3, $4, $5, 'ACT-PROC-001', 'PROCUREMENT_DIRECTOR', 'PO_ISSUED', 'PURCHASE_ORDER', 'PO-2026-0089', 'Emergency purchase approval verified by hospital committee', $6
    )
  `, [
    tenantId, partnerId, organizationId, branchId,
    `TRACE-PROC-${Date.now()}`,
    crypto.createHash('sha256').update('PO-2026-0089-CONFIRMED').digest('hex')
  ]);
  console.log('[✔] Inserted Procurement Audit Trace');

  console.log('\n============================================================');
  console.log('🎉 100% REAL POSTGRESQL MASTER SEEDING COMPLETE!');
  console.log('============================================================');

  await client.end();
}

seed().catch(console.error);
