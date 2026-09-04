import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { aiCore } from '../dist/ai/ai-core.js';
import { capabilityRegistry } from '../dist/ai/capability-registry.js';
import { toolRegistry } from '../dist/ai/tool-registry.js';
import { permissionFirewall } from '../dist/ai/permission-firewall.js';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';

describe('STEP 3: Premium AI Foundation — Comprehensive Security & Boundary Test Suite', () => {
  let app;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branch1 = '11111111-1111-4111-8111-111111111111';
  const branch2 = '33333333-3333-4333-8333-333333333333';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-physician-01',
      email: overrides.email || 'dr.cardiologist@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branch1,
      roles: overrides.roles || ['ATTENDING_PHYSICIAN', 'CARDIOLOGY_HOD'],
      permissions: overrides.permissions || [
        'ai_copilot:soap:generate',
        'ai_copilot:soap:approve',
        'ai_copilot:sepsis:read',
        'ai_copilot:sepsis:evaluate',
        'ai_copilot:ddi:evaluate',
        'ai_copilot:ddi:override',
        'ai_copilot:panic:read'
      ],
      dataScope: overrides.dataScope || 'branch',
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let authorizedPhysicianToken;
  let tenantBToken;
  let billingClerkToken;
  let unpermittedPhysicianToken;
  let nurseToken;
  let wildcardClerkToken;
  let noAiTenantToken;
  let expiredTenantToken;
  let poolRef;

  const expiredTenant = '33333333-3333-4333-8333-333333333333';

  before(async () => {
    // Initialize in-memory test database with enterprise seeds (licenses, plans, features)
    const { pool } = await setupTestDatabase();
    poolRef = pool;

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

      INSERT INTO "core"."tenants" ("id", "name", "slug")
      VALUES ('${expiredTenant}', 'Expired Facility Partner', 'expired-partner')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."subscriptions" (
        "id", "partner_id", "product_id", "plan_id", "plan_version", "status", "billing_cycle",
        "start_date", "renewal_date", "end_date"
      )
      VALUES 
        ('33333333-3333-4333-8333-333333333399', '${TEST_SEEDS.PARTNER_ID_A}', '${TEST_SEEDS.PRODUCT_ID}', '${TEST_SEEDS.PLAN_PRO_ID}', '1.0.0', 'EXPIRED', 'MONTHLY', now() - interval '60 days', now() - interval '30 days', now() - interval '30 days')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."licenses" (
        "id", "license_key", "partner_id", "tenant_id", "subscription_id", "plan_id", "license_type",
        "status", "activation_status", "max_concurrent_users", "max_doctors", "max_branches",
        "issued_at", "start_date", "expiry_date", "grace_period_end", "signature"
      )
      VALUES 
        ('44444444-4444-4444-8444-444444444499', 'LIC-EXPIRED-SEEDA-PRO1', '${TEST_SEEDS.PARTNER_ID_A}', '${expiredTenant}', '33333333-3333-4333-8333-333333333399', '${TEST_SEEDS.PLAN_PRO_ID}', 'COMMERCIAL', 'EXPIRED', 'ACTIVATED', 50, 25, 3, now() - interval '60 days', now() - interval '60 days', now() - interval '30 days', now() - interval '16 days', 'seed_signature_expired')
      ON CONFLICT DO NOTHING;
    `);

    // Register inactive capability for testing Gate 4
    capabilityRegistry.registerCapability({
      id: 'INACTIVE_EXPERIMENTAL_SURGERY',
      name: 'Inactive Experimental Surgery CDSS',
      description: 'Disabled experimental capability',
      category: 'CLINICAL',
      requiredPermission: 'ai_copilot:soap:generate',
      requiredEntitlement: 'MODULE_AI_COPILOT',
      allowedRoles: ['ATTENDING_PHYSICIAN', 'CARDIOLOGY_HOD', 'SUPER_ADMIN'],
      allowedScope: 'BRANCH',
      allowedTools: ['get_patient_vitals'],
      humanApprovalRequired: true,
      auditRequired: true,
      status: 'INACTIVE',
      version: '1.0.0'
    });

    app = await buildApp();
    await app.ready();

    authorizedPhysicianToken = createTestToken();

    tenantBToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-tenantB-user',
      email: 'user@tenantb.health'
    });

    billingClerkToken = createTestToken({
      userId: 'usr-billing-clerk',
      roles: ['BILLING_CLERK'],
      permissions: ['billing:invoices:read', 'billing:invoices:create']
    });

    unpermittedPhysicianToken = createTestToken({
      userId: 'usr-no-permissions-doc',
      permissions: [] // Zero AI permissions
    });

    nurseToken = createTestToken({
      userId: 'usr-nurse-01',
      roles: ['NURSE'],
      permissions: ['ai_copilot:sepsis:evaluate', 'clinical:vitals:read']
    });

    wildcardClerkToken = createTestToken({
      userId: 'usr-wildcard-clerk',
      roles: ['BILLING_CLERK'],
      permissions: ['*']
    });

    noAiTenantToken = createTestToken({
      tenantId: tenantB,
      userId: 'usr-starter-physician',
      roles: ['ATTENDING_PHYSICIAN'],
      permissions: ['ai_copilot:sepsis:evaluate']
    });

    expiredTenantToken = createTestToken({
      tenantId: expiredTenant,
      userId: 'usr-expired-physician',
      roles: ['ATTENDING_PHYSICIAN'],
      permissions: ['ai_copilot:sepsis:evaluate']
    });
  });

  after(async () => {
    await app.close();
  });

  // ===========================================================================
  // 1. AUTHENTICATION GATE
  // ===========================================================================
  it('TEST 01: [AUTHENTICATION] Request without Bearer token fails closed (401 Unauthorized)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      payload: { capabilityId: 'CLINICAL_AMBIENT_SCRIBE' }
    });

    assert.equal(res.statusCode, 401);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Authorization header'));
  });

  it('TEST 02: [AUTHENTICATION] Tampered JWT signature is rejected (401)', async () => {
    const tampered = authorizedPhysicianToken.substring(0, authorizedPhysicianToken.length - 6) + 'xxxxxx';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${tampered}` },
      payload: { capabilityId: 'CLINICAL_AMBIENT_SCRIBE' }
    });

    assert.equal(res.statusCode, 401);
  });

  // ===========================================================================
  // 2. TENANT ISOLATION GATE
  // ===========================================================================
  it('TEST 03: [TENANT ISOLATION] AI cannot execute across tenant boundary (Cross-Tenant blocked 403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${tenantBToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        targetTenantId: tenantA // Attempting to inspect Tenant A
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Cross-tenant') || body.error.code === 'TENANT_ACCESS_DENIED');
  });

  // ===========================================================================
  // 3. BRANCH ISOLATION GATE
  // ===========================================================================
  it('TEST 04: [BRANCH ISOLATION] Branch-scoped user cannot access unauthorized branch (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        targetBranchId: branch2 // User is scoped to branch1
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('branch') || body.error.code === 'BRANCH_ACCESS_DENIED');
  });

  // ===========================================================================
  // 4. RBAC ROLE GATE
  // ===========================================================================
  it('TEST 05: [RBAC] Non-clinical role (BILLING_CLERK) is blocked from clinical AI capabilities (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${billingClerkToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE'
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('not authorized') || body.error.message.includes('Cross-role escalation'));
  });

  // ===========================================================================
  // 5. PERMISSION GATE
  // ===========================================================================
  it('TEST 06: [PERMISSION] Physician missing ai_copilot:soap:generate permission is denied (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${unpermittedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE'
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('permission') || body.error.code === 'INSUFFICIENT_PERMISSIONS');
  });

  // ===========================================================================
  // 6. CAPABILITY WHITELIST GATE
  // ===========================================================================
  it('TEST 07: [CAPABILITY] Requesting unregistered capability fails closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'UNREGISTERED_AUTONOMOUS_SURGERY'
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('unregistered') || body.error.message.includes('inactive'));
  });

  // ===========================================================================
  // 7. TOOL BOUNDARY GATE
  // ===========================================================================
  it('TEST 08: [TOOL BOUNDARY] AI cannot invoke unregistered tool (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        toolId: 'arbitrary_unregistered_tool_xyz'
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('not registered'));
  });

  it('TEST 09: [TOOL BOUNDARY] AI cannot invoke tool not permitted for the capability (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        toolId: 'lookup_critical_lab_values' // Allowed only for DIAGNOSTIC_PANIC_ALERT
      }
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('not permitted'));
  });

  // ===========================================================================
  // 8. APPROVAL (HITL) GATE
  // ===========================================================================
  it('TEST 10: [APPROVAL GATE] Action requiring clinician approval fails if approval is denied/omitted (400)', async () => {
    // Register temporary approval-required tool to verify gate
    toolRegistry.registerTool({
      id: 'finalize_clinical_diagnosis',
      name: 'Finalize Clinical Diagnosis',
      description: 'Commits diagnosis to EHR',
      actionClassification: 'EXECUTE_WITH_APPROVAL',
      inputSchema: (await import('zod')).z.object({ code: (await import('zod')).z.string() }),
      outputSchema: (await import('zod')).z.object({ committed: (await import('zod')).z.boolean() }),
      requiredPermission: 'ai_copilot:soap:approve',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['CLINICAL_AMBIENT_SCRIBE'],
      humanApprovalRequired: true,
      auditRequired: true,
      handler: async () => ({ committed: true })
    });

    // Add tool to capability allowed list for test
    const cap = capabilityRegistry.getCapability('CLINICAL_AMBIENT_SCRIBE');
    cap.allowedTools.push('finalize_clinical_diagnosis');

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        toolId: 'finalize_clinical_diagnosis',
        toolInput: { code: 'I50.9' },
        isApprovalGranted: false // Approval omitted
      }
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('approval'));
  });

  // ===========================================================================
  // 9. AUDITABILITY & CRYPTOGRAPHIC HASH
  // ===========================================================================
  it('TEST 11: [AUDITABILITY] AI execution produces deterministic SHA-256 integrity hash', async () => {
    const payload = {
      traceId: 'TRACE-TEST-001',
      tenantId: tenantA,
      userId: 'usr-physician-01',
      capabilityId: 'SEPSIS_EARLY_WARNING_CDSS'
    };

    const hash1 = aiCore.computeAuditHash(payload);
    const hash2 = aiCore.computeAuditHash(payload);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64); // Valid SHA-256 hex string

    // Tampering test: altering a character alters hash
    const tamperedPayload = { ...payload, capabilityId: 'TAMPERED_CAPABILITY' };
    const tamperedHash = aiCore.computeAuditHash(tamperedPayload);
    assert.notEqual(hash1, tamperedHash);
  });

  // ===========================================================================
  // 10. AUTHORIZED END-TO-END FLOW
  // ===========================================================================
  it('TEST 12: [AUTHORIZED FLOW] Sepsis CDSS evaluation succeeds through Permission Firewall & Tool Registry', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' }
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.actionClassification, 'READ');
    assert.equal(body.data.data.patientMrn, 'MRN-2026-9041');
    assert.equal(body.data.data.respiratoryRate, 24);
    assert.ok(body.data.usage.durationMs >= 0);
    assert.ok(body.data.audit.integrityHash.length === 64);
  });

  it('TEST 13: [AUTHORIZED FLOW] Drug-Drug Interaction evaluation catches lethal Warfarin + Clarithromycin interaction', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'DRUG_INTERACTION_CDSS',
        toolId: 'lookup_drug_interactions',
        toolInput: {
          patientMrn: 'MRN-2026-9041',
          activeMedications: ['Warfarin 5mg Tablet'],
          newMedication: 'Clarithromycin 500mg'
        }
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.actionClassification, 'SUGGEST');
    assert.equal(body.data.data.severityLevel, 'CONTRAINDICATED_FATAL');
    assert.ok(body.data.data.clinicalConsequence.includes('hemorrhage'));
  });

  // ===========================================================================
  // 11. REGISTRY DISCOVERY APIS
  // ===========================================================================
  it('TEST 14: [REGISTRY API] GET /api/v1/partner/ai/capabilities returns all active capabilities', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai/capabilities',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 4);
    const capIds = body.data.map((c) => c.id);
    assert.ok(capIds.includes('CLINICAL_AMBIENT_SCRIBE'));
    assert.ok(capIds.includes('SEPSIS_EARLY_WARNING_CDSS'));
    assert.ok(capIds.includes('DRUG_INTERACTION_CDSS'));
    assert.ok(capIds.includes('DIAGNOSTIC_PANIC_ALERT'));
  });

  it('TEST 15: [REGISTRY API] GET /api/v1/partner/ai/tools?capabilityId=DRUG_INTERACTION_CDSS returns permitted tools', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai/tools?capabilityId=DRUG_INTERACTION_CDSS',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].id, 'lookup_drug_interactions');
  });

  it('TEST 16: [TELEMETRY API] GET /api/v1/partner/ai/usage returns telemetry for tenant', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai/usage',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 2); // Recorded in TEST 12 and 13
    assert.equal(body.data[0].tenantId, tenantA);
  });

  // ===========================================================================
  // 12. ADVERSARIAL: IDENTITY GATE (P0-3)
  // ===========================================================================
  it('TEST 17: [IDENTITY] Malformed JWT token fails closed (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: 'Bearer malformed.invalid.token' },
      payload: { capabilityId: 'CLINICAL_AMBIENT_SCRIBE' }
    });
    assert.equal(res.statusCode, 401);
  });

  it('TEST 18: [IDENTITY] Expired JWT token fails closed (401)', async () => {
    const expiredToken = signJwt(
      {
        sub: 'usr-physician-01',
        tenantId: tenantA,
        branchId: branch1,
        roles: ['ATTENDING_PHYSICIAN'],
        permissions: ['ai_copilot:soap:generate'],
        iss: ISSUER,
        aud: AUDIENCE
      },
      { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: -10 }
    );
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${expiredToken}` },
      payload: { capabilityId: 'CLINICAL_AMBIENT_SCRIBE' }
    });
    assert.equal(res.statusCode, 401);
  });

  // ===========================================================================
  // 13. ADVERSARIAL: TENANT ISOLATION GATE (P0-3)
  // ===========================================================================
  it('TEST 19: [TENANT ISOLATION] Payload tenant spoofing (targetTenantId) is blocked fail-closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        targetTenantId: tenantB
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Cross-tenant') || body.error.code === 'FORBIDDEN');
  });

  it('TEST 20: [TENANT ISOLATION] Cross-tenant tool execution attempt is blocked fail-closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${tenantBToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' },
        targetTenantId: tenantA
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Cross-tenant') || body.error.code === 'FORBIDDEN');
  });

  it('TEST 21: [TENANT ISOLATION] Database-level RLS blocks cross-tenant access to clinical AI tables', async () => {
    // Generate a SOAP note for Tenant A
    const resCreate = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        patientMrn: 'MRN-SEC-TENANT-A-01',
        patientName: 'John Doe',
        doctorName: 'Dr. Amit Sen, MD',
        specialtyName: 'Cardiology',
        audioDurationSeconds: 150,
        clinicalDialogueTranscript: 'Patient reports mild shortness of breath upon exertion.'
      }
    });
    assert.equal(resCreate.statusCode, 201);
    const createdSoapId = JSON.parse(resCreate.body).data.id;

    // Verify Tenant B cannot access this record via API
    const resTenantB = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/ai-copilot/ambient-scribe/soap',
      headers: { authorization: `Bearer ${tenantBToken}` }
    });
    assert.equal(resTenantB.statusCode, 200);
    const bodyTenantB = JSON.parse(resTenantB.body);
    const leaked = bodyTenantB.data.find((s) => s.id === createdSoapId);
    assert.equal(leaked, undefined, 'Tenant B must not see Tenant A transcript record');
  });

  // ===========================================================================
  // 14. ADVERSARIAL: BRANCH ISOLATION GATE (P0-3)
  // ===========================================================================
  it('TEST 22: [BRANCH ISOLATION] Payload branch spoofing (targetBranchId) is blocked fail-closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        targetBranchId: branch2
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('branch') || body.error.code === 'BRANCH_ACCESS_DENIED');
  });

  it('TEST 23: [BRANCH ISOLATION] Cross-branch tool invocation denied for branch-scoped clinician (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' },
        targetBranchId: branch2
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('branch'));
  });

  it('TEST 24: [BRANCH ISOLATION] Direct cross-branch access blocked by branch context', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        targetBranchId: '99999999-9999-4999-8999-999999999999'
      }
    });
    assert.equal(res.statusCode, 403);
  });

  // ===========================================================================
  // 15. ADVERSARIAL: AUTHORIZATION & PRIVILEGE ESCALATION (P0-3)
  // ===========================================================================
  it('TEST 25: [AUTHORIZATION] Role spoofing in payload cannot escalate privileges (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${billingClerkToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN', 'ATTENDING_PHYSICIAN']
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Cross-role') || body.error.message.includes('not authorized'));
  });

  it('TEST 26: [AUTHORIZATION] Permission spoofing in payload cannot escalate privileges (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${unpermittedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        permissions: ['ai_copilot:soap:generate', '*']
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('permission'));
  });

  it('TEST 27: [AUTHORIZATION] Wildcard permission abuse by non-clinical user fails closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${wildcardClerkToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE'
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Cross-role') || body.error.message.includes('not authorized'));
  });

  it('TEST 28: [AUTHORIZATION] Inactive or deprecated capability fails closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'INACTIVE_EXPERIMENTAL_SURGERY'
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('inactive') || body.error.message.includes('unregistered'));
  });

  // ===========================================================================
  // 16. ADVERSARIAL: TOOL BOUNDARY & VALIDATION (P0-3)
  // ===========================================================================
  it('TEST 29: [TOOL BOUNDARY] Direct tool invocation without capability ID is rejected (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' }
      }
    });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('capabilityId'));
  });

  it('TEST 30: [TOOL BOUNDARY] Malformed tool input violating Zod input schema is rejected fail-closed (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: '' } // min(1) violation
      }
    });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Malformed tool input') || body.error.message.includes('Validation failed'));
  });

  it('TEST 31: [TOOL BOUNDARY] Tool output schema failure is caught and blocked fail-closed (502)', async () => {
    const zod = await import('zod');
    toolRegistry.registerTool({
      id: 'faulty_output_test_tool',
      name: 'Faulty Output Test Tool',
      description: 'Returns data that violates output schema',
      actionClassification: 'READ',
      inputSchema: zod.z.object({}),
      outputSchema: zod.z.object({ requiredNumericScore: zod.z.number() }),
      requiredPermission: 'ai_copilot:sepsis:evaluate',
      tenantScoped: true,
      branchScoped: true,
      allowedCapabilities: ['SEPSIS_EARLY_WARNING_CDSS'],
      humanApprovalRequired: false,
      auditRequired: false,
      handler: async () => ({ requiredNumericScore: 'NOT_A_NUMBER' })
    });

    const cap = capabilityRegistry.getCapability('SEPSIS_EARLY_WARNING_CDSS');
    cap.allowedTools.push('faulty_output_test_tool');

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'faulty_output_test_tool',
        toolInput: {}
      }
    });
    assert.equal(res.statusCode, 502);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('output safety violation') || body.error.message.includes('failed'));
  });

  it('TEST 32: [TOOL BOUNDARY] Arbitrary unregistered tool invocation fails closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'unregistered_hack_tool_007'
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('not registered'));
  });

  // ===========================================================================
  // 17. ADVERSARIAL: COMMERCIAL ENTITLEMENT (P0-3)
  // ===========================================================================
  it('TEST 33: [COMMERCIAL] Tenant on plan without MODULE_AI_COPILOT entitlement is blocked fail-closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${noAiTenantToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' }
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('MODULE_AI_COPILOT') || body.error.message.includes('entitlement'));
  });

  it('TEST 34: [COMMERCIAL] Expired software license blocks AI execution (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${expiredTenantToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' }
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Commercial access') || body.error.message.includes('EXPIRED'));
  });

  it('TEST 35: [COMMERCIAL] Commercial bypass attempt flag is completely ignored and blocked (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: {
        authorization: `Bearer ${noAiTenantToken}`,
        'x-bypass-entitlement': 'true',
        'x-super-admin-override': 'true'
      },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' },
        bypassCommercialCheck: true,
        entitlementOverride: true
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('entitlement') || body.error.code === 'FORBIDDEN');
  });

  // ===========================================================================
  // 18. ADVERSARIAL: HUMAN-IN-THE-LOOP (HITL) (P0-3)
  // ===========================================================================
  it('TEST 36: [HITL] Missing approval for approval-required tool fails closed (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        toolId: 'finalize_clinical_diagnosis',
        toolInput: { code: 'I50.9' }
        // isApprovalGranted omitted
      }
    });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('approval'));
  });

  it('TEST 37: [HITL] Explicitly denied clinician approval is rejected (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        toolId: 'finalize_clinical_diagnosis',
        toolInput: { code: 'I50.9' },
        isApprovalGranted: false
      }
    });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('approval') && body.error.message.includes('denied'));
  });

  it('TEST 38: [HITL] Forged approval attempt by nurse without doctor approval authority is blocked fail-closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${nurseToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' },
        isApprovalGranted: true,
        approverId: 'usr-nurse-01'
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Forged approval') || body.error.message.includes('clinician role'));
  });

  it('TEST 39: [HITL] Approver identity mismatch (approverId spoofing) is blocked fail-closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        toolId: 'finalize_clinical_diagnosis',
        toolInput: { code: 'I50.9' },
        isApprovalGranted: true,
        approverId: 'usr-different-physician-99' // Mismatch with caller usr-physician-01
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Approver identity mismatch'));
  });

  it('TEST 40: [HITL] Approval capability mismatch is blocked fail-closed (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'CLINICAL_AMBIENT_SCRIBE',
        toolId: 'finalize_clinical_diagnosis',
        toolInput: { code: 'I50.9' },
        isApprovalGranted: true,
        approverId: 'usr-physician-01',
        approvalCapabilityId: 'SEPSIS_EARLY_WARNING_CDSS' // Mismatch with CLINICAL_AMBIENT_SCRIBE
      }
    });
    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.ok(body.error.message.includes('Approval capability mismatch'));
  });

  // ===========================================================================
  // 19. ADVERSARIAL: CONTEXT INTEGRITY & AUDIT TRAIL (P0-2, P0-3)
  // ===========================================================================
  it('TEST 41: [CONTEXT INTEGRITY] Client payload attempting to override tenantId/branchId/userId is completely ignored or rejected', async () => {
    // Attempting to override tenantId in request body is caught and rejected by auth-guard (403)
    const resTenantSpoof = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' },
        tenantId: 'SPOOFED_TENANT_XYZ'
      }
    });
    assert.equal(resTenantSpoof.statusCode, 403);

    // Attempting to override userId, roles, or permissions in payload cannot bypass session (server session strictly prevails)
    const resOverride = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/ai/execute',
      headers: { authorization: `Bearer ${authorizedPhysicianToken}` },
      payload: {
        capabilityId: 'SEPSIS_EARLY_WARNING_CDSS',
        toolId: 'get_patient_vitals',
        toolInput: { patientMrn: 'MRN-2026-9041' },
        userId: 'SPOOFED_USER_XYZ',
        roles: ['SUPER_ADMIN'],
        permissions: ['*']
      }
    });
    assert.equal(resOverride.statusCode, 200);
    const body = JSON.parse(resOverride.body);
    assert.equal(body.success, true);

    // Verify usage telemetry recorded the server-derived tenantId and userId, NOT the spoofed ones
    const telemetry = aiCore.getTelemetryForTenant(tenantA);
    const lastRecord = telemetry[telemetry.length - 1];
    assert.equal(lastRecord.tenantId, tenantA);
    assert.equal(lastRecord.userId, 'usr-physician-01');
  });

  it('TEST 42: [PERSISTENT AUDIT] AI execution records persistent DB event with SHA-256 chain and zero credential leakage', async () => {
    const events = await aiCore.getAuditEventsForTenant(tenantA, 20);
    assert.ok(events.length > 0, 'Persistent audit events must be found in database');

    const executedEvent = events.find((e) => e.eventType === 'AI_CAPABILITY_EXECUTED');
    assert.ok(executedEvent, 'Must have recorded AI_CAPABILITY_EXECUTED event in database');
    assert.equal(executedEvent.resourceType, 'AI_CAPABILITY');
    assert.ok(executedEvent.integrityHash.length === 64, 'Integrity hash must be valid SHA-256');

    // Also verify failure audit event is recorded in database
    const failedEvent = events.find((e) => e.eventType === 'AI_CAPABILITY_FAILED');
    assert.ok(failedEvent, 'Must have recorded AI_CAPABILITY_FAILED event in database');

    // Verify zero credential leakage in metadata
    const metadataStr = JSON.stringify(executedEvent.metadata);
    assert.ok(!metadataStr.includes('Bearer'), 'Must not leak Bearer token');
    assert.ok(!metadataStr.includes(MASTER_SECRET), 'Must not leak JWT master secret');
    assert.ok(!metadataStr.includes('password'), 'Must not leak password');

    // Verify telemetry fields present in metadata
    assert.ok(executedEvent.metadata.inputTokens !== undefined);
    assert.ok(executedEvent.metadata.outputTokens !== undefined);
    assert.ok(executedEvent.metadata.durationMs !== undefined);
  });
});
