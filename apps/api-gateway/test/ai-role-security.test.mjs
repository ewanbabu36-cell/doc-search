import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { toolRegistry } from '../dist/ai/tool-registry.js';
import { capabilityRegistry } from '../dist/ai/capability-registry.js';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';
import { z } from 'zod';

describe('STEP 4: Role AI Implementation — Multi-Role Security & Boundary Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branch1 = '11111111-1111-4111-8111-111111111111';
  const branch2 = '33333333-3333-4333-8333-333333333333';

  function createRoleToken(options) {
    const claims = {
      sub: options.userId,
      email: options.email,
      tenantId: options.tenantId !== undefined ? options.tenantId : tenantA,
      branchId: options.branchId !== undefined ? options.branchId : branch1,
      roles: options.roles,
      permissions: options.permissions || [],
      dataScope: options.dataScope || 'branch',
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, {
      secret: MASTER_SECRET,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresInSeconds: 3600
    });
  }

  // Tokens for all 9 platform roles
  let ownerToken;
  let managerToken;
  let doctorToken;
  let nurseToken;
  let receptionToken;
  let pharmacyToken;
  let labToken;
  let financeToken;
  let patientAToken;
  let patientBToken;

  before(async () => {
    // 1. Initialize in-memory test database with enterprise seeds (licenses, plans, features)
    const { pool } = await setupTestDatabase();

    const FEAT_AI_ID = '66666666-6666-4666-8666-666666666699';
    await pool.query(`
      INSERT INTO "company"."features" ("id", "code", "name", "description", "category", "status")
      VALUES ('${FEAT_AI_ID}', 'MODULE_AI_COPILOT', 'Premium AI Clinical Copilot', 'Ambient Scribe, CDSS & Intelligence', 'MODULE_ACCESS', 'ACTIVE')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."plan_entitlements" ("id", "plan_id", "feature_id", "entitlement_type", "value", "status")
      VALUES 
        ('55555555-5555-4555-8555-555555555099', '${TEST_SEEDS.PLAN_PRO_ID}', '${FEAT_AI_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555098', '${TEST_SEEDS.PLAN_ENTERPRISE_ID}', '${FEAT_AI_ID}', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `);

    app = await buildApp();
    await app.ready();

    // 1. OWNER
    ownerToken = createRoleToken({
      userId: 'usr-owner-01',
      email: 'owner@hospital.health',
      roles: ['HOSPITAL_OWNER', 'OWNER'],
      permissions: ['billing:invoices:read', 'partners:read', 'financial:reports:read'],
      dataScope: 'tenant'
    });

    // 2. MANAGER
    managerToken = createRoleToken({
      userId: 'usr-manager-01',
      email: 'manager@hospital.health',
      roles: ['BRANCH_MANAGER', 'OPERATIONS_MANAGER'],
      permissions: ['clinical:encounters:read', 'inventory:read', 'facility:read'],
      dataScope: 'branch'
    });

    // 3. DOCTOR
    doctorToken = createRoleToken({
      userId: 'usr-doctor-01',
      email: 'dr.amit@hospital.health',
      roles: ['ATTENDING_PHYSICIAN', 'CARDIOLOGY_HOD'],
      permissions: [
        'clinical:consultations:read',
        'clinical:consultations:create',
        'ai_copilot:soap:generate',
        'ai_copilot:soap:approve',
        'ai_copilot:ddi:evaluate',
        'ai_copilot:sepsis:evaluate'
      ],
      dataScope: 'branch'
    });

    // 4. NURSE
    nurseToken = createRoleToken({
      userId: 'usr-nurse-01',
      email: 'nurse.sarah@hospital.health',
      roles: ['HEAD_NURSE', 'ICU_NURSE'],
      permissions: [
        'clinical:vitals:read',
        'clinical:vitals:create',
        'ai_copilot:sepsis:evaluate'
      ],
      dataScope: 'branch'
    });

    // 5. RECEPTION
    receptionToken = createRoleToken({
      userId: 'usr-reception-01',
      email: 'frontdesk@hospital.health',
      roles: ['RECEPTIONIST', 'FRONT_DESK'],
      permissions: ['appointments:read', 'appointments:create', 'patients:create'],
      dataScope: 'branch'
    });

    // 6. PHARMACY
    pharmacyToken = createRoleToken({
      userId: 'usr-pharmacy-01',
      email: 'pharmacist.rahul@hospital.health',
      roles: ['PHARMACIST', 'PHARMACY_MANAGER'],
      permissions: [
        'pharmacy:dispense:read',
        'pharmacy:inventory:read',
        'ai_copilot:ddi:evaluate'
      ],
      dataScope: 'branch'
    });

    // 7. LAB
    labToken = createRoleToken({
      userId: 'usr-lab-01',
      email: 'pathologist.drneha@hospital.health',
      roles: ['PATHOLOGIST', 'LAB_TECHNICIAN'],
      permissions: ['lab:orders:read', 'lab:orders:update', 'ai_copilot:panic:read'],
      dataScope: 'branch'
    });

    // 8. FINANCE
    financeToken = createRoleToken({
      userId: 'usr-finance-01',
      email: 'cfo.arun@hospital.health',
      roles: ['FINANCE_MANAGER', 'FINANCE_CONTROLLER'],
      permissions: ['billing:invoices:read', 'billing:invoices:create'],
      dataScope: 'tenant'
    });

    // 9. PATIENT (Two distinct patients to verify isolation)
    patientAToken = createRoleToken({
      userId: 'PAT-2026-0001',
      email: 'patient.a@patientportal.health',
      roles: ['PATIENT'],
      permissions: ['patient:portal:read'],
      dataScope: 'own'
    });

    patientBToken = createRoleToken({
      userId: 'PAT-2026-0002',
      email: 'patient.b@patientportal.health',
      roles: ['PATIENT'],
      permissions: ['patient:portal:read'],
      dataScope: 'own'
    });
  });

  after(async () => {
    await app.close();
  });

  // ===========================================================================
  // 1. ROLE CONTEXT RESOLUTION (9 Platform Roles)
  // ===========================================================================
  describe('1. Role Context Resolution API', () => {
    it('1.1: Resolves OWNER context with ORGANIZATION dataScope', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'OWNER');
      assert.equal(body.data.dataScope, 'ORGANIZATION');
      assert.ok(body.data.permittedCapabilities.includes('OWNER_REVENUE_INTELLIGENCE'));
      assert.ok(body.data.permittedTools.includes('get_owner_revenue_summary'));
    });

    it('1.2: Resolves MANAGER context with BRANCH dataScope', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${managerToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'MANAGER');
      assert.equal(body.data.dataScope, 'BRANCH');
      assert.ok(body.data.permittedCapabilities.includes('MANAGER_OPERATIONAL_OVERVIEW'));
    });

    it('1.3: Resolves DOCTOR context with BRANCH dataScope and humanApprovalRequired=true', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${doctorToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'DOCTOR');
      assert.equal(body.data.dataScope, 'BRANCH');
      assert.equal(body.data.humanApprovalRequired, true);
      assert.ok(body.data.permittedCapabilities.includes('DOCTOR_ENCOUNTER_SUMMARY'));
      assert.ok(body.data.permittedCapabilities.includes('CLINICAL_AMBIENT_SCRIBE'));
    });

    it('1.4: Resolves NURSE context with BRANCH dataScope and humanApprovalRequired=true', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${nurseToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'NURSE');
      assert.equal(body.data.dataScope, 'BRANCH');
      assert.equal(body.data.humanApprovalRequired, true);
      assert.ok(body.data.permittedCapabilities.includes('NURSE_PATIENT_PREPARATION'));
    });

    it('1.5: Resolves RECEPTION context with BRANCH dataScope', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${receptionToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'RECEPTION');
      assert.equal(body.data.dataScope, 'BRANCH');
      assert.ok(body.data.permittedCapabilities.includes('RECEPTION_APPOINTMENT_ASSISTANCE'));
    });

    it('1.6: Resolves PHARMACY context with BRANCH dataScope', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${pharmacyToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'PHARMACY');
      assert.equal(body.data.dataScope, 'BRANCH');
      assert.ok(body.data.permittedCapabilities.includes('PHARMACY_PRESCRIPTION_ASSISTANCE'));
    });

    it('1.7: Resolves LAB context with BRANCH dataScope and humanApprovalRequired=true', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${labToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'LAB');
      assert.equal(body.data.dataScope, 'BRANCH');
      assert.equal(body.data.humanApprovalRequired, true);
      assert.ok(body.data.permittedCapabilities.includes('LAB_SAMPLE_WORKFLOW'));
    });

    it('1.8: Resolves FINANCE context with ORGANIZATION dataScope', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${financeToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'FINANCE');
      assert.equal(body.data.dataScope, 'ORGANIZATION');
      assert.ok(body.data.permittedCapabilities.includes('FINANCE_BILLING_ANALYTICS'));
    });

    it('1.9: Resolves PATIENT context with PATIENT_OWN dataScope and bound patientMrn', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/ai/role-context',
        headers: { authorization: `Bearer ${patientAToken}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.data.role, 'PATIENT');
      assert.equal(body.data.dataScope, 'PATIENT_OWN');
      assert.equal(body.data.patientMrn, 'PAT-2026-0001');
      assert.ok(body.data.permittedCapabilities.includes('PATIENT_VISIT_GUIDANCE'));
    });
  });

  // ===========================================================================
  // 2. AUTHORIZED EXECUTION ACROSS ALL 9 ROLES
  // ===========================================================================
  describe('2. Authorized AI Execution per Role', () => {
    it('2.1: OWNER executes OWNER_REVENUE_INTELLIGENCE with get_owner_revenue_summary', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          capabilityId: 'OWNER_REVENUE_INTELLIGENCE',
          toolId: 'get_owner_revenue_summary'
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.totalRevenueGross, 4850000);
      assert.equal(body.data.actionClassification, 'READ');
      assert.equal(body.data.audit.integrityHash.length, 64);
    });

    it('2.2: MANAGER executes MANAGER_OPERATIONAL_OVERVIEW with get_manager_operations_summary', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          capabilityId: 'MANAGER_OPERATIONAL_OVERVIEW',
          toolId: 'get_manager_operations_summary'
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.scheduledAppointmentsCount, 84);
      assert.equal(body.data.currentBedOccupancyPct || body.data.data.currentBedOccupancyPct, 78.5);
    });

    it('2.3: DOCTOR executes DOCTOR_ENCOUNTER_SUMMARY with get_patient_clinical_history', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${doctorToken}` },
        payload: {
          capabilityId: 'DOCTOR_ENCOUNTER_SUMMARY',
          toolId: 'get_patient_clinical_history',
          toolInput: { patientMrn: 'MRN-2026-CARDIO-88' }
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.patientMrn, 'MRN-2026-CARDIO-88');
      assert.ok(body.data.data.chronicConditions.length > 0);
    });

    it('2.4: NURSE executes NURSE_PATIENT_PREPARATION with get_nurse_care_checklist', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${nurseToken}` },
        payload: {
          capabilityId: 'NURSE_PATIENT_PREPARATION',
          toolId: 'get_nurse_care_checklist',
          toolInput: { patientMrn: 'MRN-2026-WARD-12' }
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.bedNumber, 'ICU-Bed-04');
      assert.ok(body.data.data.careTasks.includes('Measure q4h Vitals'));
    });

    it('2.5: RECEPTION executes RECEPTION_APPOINTMENT_ASSISTANCE with get_reception_queue_schedule', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${receptionToken}` },
        payload: {
          capabilityId: 'RECEPTION_APPOINTMENT_ASSISTANCE',
          toolId: 'get_reception_queue_schedule',
          toolInput: { department: 'Cardiology' }
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.ok(body.data.data.availableSlots.length > 0);
      assert.equal(body.data.data.activeQueueWaitingCount, 6);
    });

    it('2.6: PHARMACY executes PHARMACY_PRESCRIPTION_ASSISTANCE with get_pharmacy_inventory_status', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${pharmacyToken}` },
        payload: {
          capabilityId: 'PHARMACY_PRESCRIPTION_ASSISTANCE',
          toolId: 'get_pharmacy_inventory_status',
          toolInput: { drugName: 'Torsemide 10mg Tablet' }
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.ok(body.data.data.items.length > 0);
      assert.equal(body.data.data.items[0].drugName, 'Torsemide 10mg Tablet');
    });

    it('2.7: LAB executes LAB_SAMPLE_WORKFLOW with get_lab_pending_orders', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${labToken}` },
        payload: {
          capabilityId: 'LAB_SAMPLE_WORKFLOW',
          toolId: 'get_lab_pending_orders'
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.ok(body.data.data.pendingOrders.length > 0);
      assert.equal(body.data.data.pendingOrders[0].orderId, 'LAB-ORD-9021');
    });

    it('2.8: FINANCE executes FINANCE_BILLING_ANALYTICS with get_finance_outstanding_invoices', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${financeToken}` },
        payload: {
          capabilityId: 'FINANCE_BILLING_ANALYTICS',
          toolId: 'get_finance_outstanding_invoices'
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.totalUnpaidInvoices, 38);
      assert.equal(body.data.data.outstandingReceivables, 428000);
    });

    it('2.9: PATIENT executes PATIENT_VISIT_GUIDANCE with get_patient_personal_appointments for own MRN', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${patientAToken}` },
        payload: {
          capabilityId: 'PATIENT_VISIT_GUIDANCE',
          toolId: 'get_patient_personal_appointments',
          toolInput: { patientMrn: 'PAT-2026-0001' }
        }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.patientMrn, 'PAT-2026-0001');
      assert.ok(body.data.data.upcomingAppointments.length > 0);
    });
  });

  // ===========================================================================
  // 3. CROSS-ROLE PRIVILEGE ESCALATION PREVENTION (FAIL-CLOSED 403)
  // ===========================================================================
  describe('3. Cross-Role Privilege Escalation Prevention (Fail-Closed)', () => {
    it('3.1: RECEPTION attempting to invoke DOCTOR clinical capability is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${receptionToken}` },
        payload: {
          capabilityId: 'DOCTOR_ENCOUNTER_SUMMARY',
          toolId: 'get_patient_clinical_history',
          toolInput: { patientMrn: 'MRN-2026-CARDIO-88' }
        }
      });
      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.error.message.includes('Cross-role escalation') ||
        body.error.message.includes('not authorized')
      );
    });

    it('3.2: NURSE attempting to invoke FINANCE capability is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${nurseToken}` },
        payload: {
          capabilityId: 'FINANCE_BILLING_ANALYTICS',
          toolId: 'get_finance_outstanding_invoices'
        }
      });
      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.error.message.includes('Cross-role escalation') ||
        body.error.message.includes('not authorized')
      );
    });

    it('3.3: PHARMACY attempting to invoke OWNER executive revenue capability is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${pharmacyToken}` },
        payload: {
          capabilityId: 'OWNER_REVENUE_INTELLIGENCE',
          toolId: 'get_owner_revenue_summary'
        }
      });
      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.error.message.includes('Cross-role escalation') ||
        body.error.message.includes('not authorized')
      );
    });

    it('3.4: FINANCE attempting to invoke DOCTOR clinical capability is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${financeToken}` },
        payload: {
          capabilityId: 'CLINICAL_AMBIENT_SCRIBE'
        }
      });
      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.error.message.includes('Cross-role escalation') ||
        body.error.message.includes('not authorized')
      );
    });

    it('3.5: PATIENT attempting to invoke STAFF/DOCTOR clinical capability is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${patientAToken}` },
        payload: {
          capabilityId: 'DOCTOR_CLINICAL_DOCUMENTATION'
        }
      });
      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.error.message.includes('Cross-role escalation') ||
        body.error.message.includes('not authorized')
      );
    });

    it('3.6: MANAGER attempting to invoke OWNER organization analytics is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          capabilityId: 'OWNER_ORGANIZATION_ANALYTICS'
        }
      });
      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(
        body.error.message.includes('Cross-role escalation') ||
        body.error.message.includes('not authorized')
      );
    });
  });

  // ===========================================================================
  // 4. STRICT PATIENT ISOLATION GATE (Gate 4.6)
  // ===========================================================================
  describe('4. Strict Patient Data Isolation Boundary', () => {
    it('4.1: PATIENT A attempting to view PATIENT B records is rejected fail-closed (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${patientAToken}` },
        payload: {
          capabilityId: 'PATIENT_VISIT_GUIDANCE',
          toolId: 'get_patient_personal_appointments',
          toolInput: { patientMrn: 'PAT-2026-0002' } // Patient A probing Patient B!
        }
      });

      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(body.error.message.includes('Patient data isolation violation'));
    });

    it('4.2: PATIENT B requesting their own MRN succeeds (200)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${patientBToken}` },
        payload: {
          capabilityId: 'PATIENT_VISIT_GUIDANCE',
          toolId: 'get_patient_personal_appointments',
          toolInput: { patientMrn: 'PAT-2026-0002' }
        }
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.patientMrn, 'PAT-2026-0002');
    });
  });

  // ===========================================================================
  // 5. CROSS-BRANCH & CROSS-TENANT BOUNDARY ENFORCEMENT
  // ===========================================================================
  describe('5. Cross-Branch & Cross-Tenant Boundary Enforcement', () => {
    it('5.1: DOCTOR scoped to Branch 1 attempting to execute in Branch 2 is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${doctorToken}` },
        payload: {
          capabilityId: 'DOCTOR_ENCOUNTER_SUMMARY',
          targetBranchId: branch2
        }
      });

      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(body.error.message.includes('Cross-branch violation'));
    });

    it('5.2: DOCTOR attempting to execute against another Tenant is blocked (403)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${doctorToken}` },
        payload: {
          capabilityId: 'DOCTOR_ENCOUNTER_SUMMARY',
          targetTenantId: tenantB
        }
      });

      assert.equal(res.statusCode, 403);
      const body = JSON.parse(res.body);
      assert.ok(body.error.message.includes('Cross-tenant violation'));
    });
  });

  // ===========================================================================
  // 6. HUMAN-IN-THE-LOOP (HITL) APPROVAL ENFORCEMENT
  // ===========================================================================
  describe('6. Human-in-the-Loop (HITL) Safety Gates', () => {
    it('6.1: High-risk clinical commit tool without verified clinician approval is blocked (400)', async () => {
      // Register approval-required tool
      toolRegistry.registerTool({
        id: 'commit_clinical_order',
        name: 'Commit Clinical Prescription Order',
        description: 'Commits medication order to EHR system',
        actionClassification: 'EXECUTE_WITH_APPROVAL',
        inputSchema: z.object({ medication: z.string(), dose: z.string() }),
        outputSchema: z.object({ orderCommitted: z.boolean() }),
        requiredPermission: 'clinical:consultations:create',
        tenantScoped: true,
        branchScoped: true,
        allowedCapabilities: ['DOCTOR_CLINICAL_DOCUMENTATION'],
        humanApprovalRequired: true,
        auditRequired: true,
        handler: async () => ({ orderCommitted: true })
      });

      const cap = capabilityRegistry.getCapability('DOCTOR_CLINICAL_DOCUMENTATION');
      if (cap && !cap.allowedTools.includes('commit_clinical_order')) {
        cap.allowedTools.push('commit_clinical_order');
      }

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${doctorToken}` },
        payload: {
          capabilityId: 'DOCTOR_CLINICAL_DOCUMENTATION',
          toolId: 'commit_clinical_order',
          toolInput: { medication: 'Metoprolol Tartrate', dose: '25mg BID' },
          isApprovalGranted: false // Human clinician approval omitted
        }
      });

      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.ok(body.error.message.includes('requires verified clinician approval'));
    });

    it('6.2: High-risk clinical commit succeeds when verified doctor approval is provided', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/ai/execute',
        headers: { authorization: `Bearer ${doctorToken}` },
        payload: {
          capabilityId: 'DOCTOR_CLINICAL_DOCUMENTATION',
          toolId: 'commit_clinical_order',
          toolInput: { medication: 'Metoprolol Tartrate', dose: '25mg BID' },
          isApprovalGranted: true,
          approverId: 'usr-doctor-01'
        }
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.equal(body.data.data.orderCommitted, true);
    });

    it('6.3: Autonomous financial alteration is impossible because no ledger tampering tools exist in registry', () => {
      const tools = toolRegistry.listTools();
      const mutatingFinancialTools = tools.filter(
        (t) =>
          t.actionClassification === 'EXECUTE' &&
          (t.id.includes('refund') || t.id.includes('discount') || t.id.includes('alter_invoice'))
      );
      assert.equal(mutatingFinancialTools.length, 0);
    });
  });
});
