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

  before(async () => {
    // Initialize in-memory test database with enterprise seeds (licenses, plans, features)
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
});
