import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import { setupTestDatabase, TEST_SEEDS } from '@docsearch/database';

describe('Domain 3.5 — WhatsApp Patient Engagement & Tele-Triage Vertical Slice Test Suite', () => {
  let app;
  let testDb;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = TEST_SEEDS.TENANT_A;
  const tenantB = TEST_SEEDS.TENANT_B;
  const branchId = TEST_SEEDS.BRANCH_A;

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr-whatsapp-agent-01',
      email: overrides.email || 'whatsapp.agent@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['CUSTOMER_SUPPORT', 'NURSE'],
      permissions: overrides.permissions || [
        'whatsapp:conversation:read',
        'whatsapp:conversation:write',
        'whatsapp:dispatch:read',
        'whatsapp:dispatch:write',
        'whatsapp:queue:read',
        'whatsapp:queue:write'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  let validToken;
  let tenantBToken;
  let createdConvId;
  let createdDispatchId;

  before(async () => {
    testDb = await setupTestDatabase();

    await testDb.pool.query(`
      INSERT INTO "company"."features" ("id", "code", "name", "description", "category", "status")
      VALUES ('55555555-5555-4555-8555-555555555030', 'WHATSAPP_AUTOMATION', 'WhatsApp Patient Engagement & Triage', 'WhatsApp bot, reports & appointment reminders', 'MODULE_ACCESS', 'ACTIVE')
      ON CONFLICT DO NOTHING;

      INSERT INTO "company"."plan_entitlements" ("id", "plan_id", "feature_id", "entitlement_type", "value", "status")
      VALUES 
        ('55555555-5555-4555-8555-555555555130', '${TEST_SEEDS.PLAN_PRO_ID}', '55555555-5555-4555-8555-555555555030', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE'),
        ('55555555-5555-4555-8555-555555555131', '${TEST_SEEDS.PLAN_STARTER_ID}', '55555555-5555-4555-8555-555555555030', 'FEATURE_ACCESS', '{"enabled":true}'::jsonb, 'ACTIVE')
      ON CONFLICT DO NOTHING;
    `);

    app = await buildApp();
    await app.ready();

    validToken = createTestToken();
    tenantBToken = createTestToken({ tenantId: tenantB, userId: 'usr-wa-tenantB' });
  });

  after(async () => {
    if (app) await app.close();
    if (testDb?.cleanup) await testDb.cleanup();
  });

  // TEST 01: Overview Metrics
  it('TEST 01: GET /api/v1/partner/whatsapp/overview returns live engagement telemetry', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(typeof body.data.totalConversationsToday === 'number');
    assert.ok(typeof body.data.botHandledInteractionsPct === 'number');
    assert.ok(typeof body.data.documentsDispatchedMonth === 'number');
  });

  // TEST 02: Inbound Webhook Processing (Simulated Patient Message)
  it('TEST 02: POST /api/v1/partner/whatsapp/webhook ingests patient inbound message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/whatsapp/webhook',
      headers: {
        'content-type': 'application/json',
        'x-tenant-id': tenantA
      },
      payload: {
        fromPhone: '+919820154321',
        patientName: 'Ramesh Patel',
        text: 'Hi DocSearch, I need my latest lab report'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(body.data.conversationId);
    createdConvId = body.data.conversationId;
  });

  // TEST 03: List Conversations
  it('TEST 03: GET /api/v1/partner/whatsapp/conversations returns active chat list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/conversations',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  // TEST 04: Single Conversation by ID
  it('TEST 04: GET /api/v1/partner/whatsapp/conversations/:id retrieves conversation details', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/whatsapp/conversations/${createdConvId}`,
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.id, createdConvId);
  });

  // TEST 05: Send Message from Live Desk (Human Agent Outbound)
  it('TEST 05: POST /api/v1/partner/whatsapp/conversations/:id/messages sends agent reply', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/whatsapp/conversations/${createdConvId}/messages`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        messageType: 'TEXT_MESSAGE',
        textContent: 'Hello Ramesh, your report has been generated and dispatched below.'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.id, createdConvId);
  });

  // TEST 06: Toggle Bot Active Handoff
  it('TEST 06: POST /api/v1/partner/whatsapp/conversations/:id/toggle-bot hands off to human desk', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/partner/whatsapp/conversations/${createdConvId}/toggle-bot`,
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        botActive: false,
        agentName: 'Pooja Nair (Senior Desk Agent)'
      }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.botActive, false);
    assert.equal(body.data.assignedAgent, 'Pooja Nair (Senior Desk Agent)');
  });

  // TEST 07: Dispatch Health Document (PDF Report)
  it('TEST 07: POST /api/v1/partner/whatsapp/dispatches records and dispatches lab document', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/whatsapp/dispatches',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-9021',
        patientName: 'Ramesh Patel',
        phoneNumber: '+919820154321',
        documentType: 'DIAGNOSTIC_LAB_REPORT',
        documentNumber: 'LAB-2026-99120',
        fileName: 'Comprehensive_Metabolic_Panel.pdf',
        fileSizeKb: 340
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.patientMrn, 'MRN-2026-9021');
    createdDispatchId = body.data.id;
  });

  // TEST 08: Get Document Dispatches Ledger
  it('TEST 08: GET /api/v1/partner/whatsapp/dispatches returns dispatched documents', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/dispatches',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.some((d) => d.id === createdDispatchId || d.documentNumber === 'LAB-2026-99120'));
  });

  // TEST 09: Live Queue Tokens
  it('TEST 09: GET /api/v1/partner/whatsapp/queue-tokens returns live OPD queue tokens', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/queue-tokens',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // TEST 10: Medication Reminders Dispatch
  it('TEST 10: POST /api/v1/partner/whatsapp/medication-reminders dispatches dosage reminder', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/partner/whatsapp/medication-reminders',
      headers: { authorization: `Bearer ${validToken}` },
      payload: {
        patientMrn: 'MRN-2026-9021',
        phoneNumber: '+919820154321',
        drugName: 'Telma 40mg (Telmisartan)',
        dosageInstructions: '1 tablet daily morning after breakfast'
      }
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.equal(body.data.drugName, 'Telma 40mg (Telmisartan)');
  });

  // TEST 11: Audit Traces Ledger
  it('TEST 11: GET /api/v1/partner/whatsapp/audit-traces returns cryptographic audit chain', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/audit-traces',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
    assert.ok(body.data[0].integrityHash);
  });

  // TEST 12: Webhook Challenge Handshake (Meta verification)
  it('TEST 12: GET /api/v1/partner/whatsapp/webhook handles Meta hub.challenge verification', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=docsearch_wa_webhook_verify_token_prod&hub.challenge=test_challenge_12345'
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload, 'test_challenge_12345');
  });

  // TEST 13: Tenant Isolation: Tenant B cannot see Tenant A conversations
  it('TEST 13: Tenant Isolation: Tenant B cannot access Tenant A WhatsApp conversations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/partner/whatsapp/conversations/${createdConvId}`,
      headers: { authorization: `Bearer ${tenantBToken}` }
    });

    assert.equal(res.statusCode, 404);
  });

  // TEST 14: Unauthenticated request fails closed with 401
  it('TEST 14: Unauthenticated request to /api/v1/partner/whatsapp/overview fails closed with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/overview'
    });

    assert.equal(res.statusCode, 401);
  });

  // TEST 15: Post-dispatch overview metrics are dynamically incremented
  it('TEST 15: Overview metrics reflect dynamic increments after conversation and dispatch operations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/partner/whatsapp/overview',
      headers: { authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.ok(body.data.totalConversationsToday >= 1);
    assert.ok(body.data.documentsDispatchedMonth >= 1);
  });
});
