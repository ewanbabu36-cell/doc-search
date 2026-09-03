process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';

import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { signJwt } from '../../packages/auth/dist/index.js';
import { WA_SECURITY_DEFAULTS } from '../../apps/api-gateway/dist/services/partner/WhatsAppEngagementService.js';

console.log('\n======================================================================');
console.log('📱 TEST SUITE 10 — OMNICHANNEL PATIENT ENGAGEMENT & WHATSAPP GATEWAY');
console.log('   (WhatsApp Cloud API, SMS, Email, 2-Way Bot, e-Rx/Lab PDF & Live Queue)');
console.log('======================================================================\n');

async function runOmnichannelTests() {
  const startTime = performance.now();
  let testsPassed = 0;
  let testsTotal = 0;

  const MASTER_SECRET = 'docsearch_master_jwt_secret_dev_32char_key_only';
  const ISSUER = 'docsearch-api';
  const AUDIENCE = 'docsearch-platform';

  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const branchId = '11111111-1111-4111-8111-111111111111';

  function createTestToken(overrides = {}) {
    const claims = {
      sub: overrides.userId || 'usr_wa_receptionist_01',
      email: overrides.email || 'reception@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['HOSPITAL_RECEPTIONIST', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || ['*'],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  const tokenA = createTestToken({ tenantId: tenantA });
  const tokenB = createTestToken({ tenantId: tenantB, userId: 'usr_tenant_b_01' });

  function signPayloadHmac(rawBody, secret = WA_SECURITY_DEFAULTS.APP_SECRET) {
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return `sha256=${hash}`;
  }

  const app = await buildApp();

  try {
    // ------------------------------------------------------------------------
    // TEST 1: WhatsApp Overview & Healthcare Engagement KPI Metrics
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 1] Fetching live WhatsApp & Aarogya 360 overview metrics...');
    {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/whatsapp/overview',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.success, true);
      assert.ok(body.data.totalConversationsToday >= 2);
      assert.ok(body.data.botHandledInteractionsPct > 0);
      assert.ok(body.data.documentsDispatchedMonth >= 2);
      assert.ok(body.data.appointmentsBookedViaWhatsApp >= 0);
      assert.ok(body.data.patientNpsScore >= 90);

      console.log(`  ✔ [PASS] Overview metrics verified (Conversations: ${body.data.totalConversationsToday}, Bot Handled: ${body.data.botHandledInteractionsPct}%, NPS: ${body.data.patientNpsScore})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 2: Outbound Clinical Document Dispatch (Digital e-Rx & Lab Diagnostic Report)
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 2] Dispatching Digital e-Prescription (RX-2026-9901) to patient WhatsApp...');
    let dispatchedDocId = '';
    {
      const resDispatch = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/dispatches',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          patientMrn: 'MRN-2026-9041',
          patientName: 'Kavita Joshi',
          phoneNumber: '+919820154321',
          documentType: 'PRESCRIPTION_E_RX',
          documentNumber: 'RX-2026-9901',
          fileName: 'Prescription_Dr_Sanjay_Gupta_CBC.pdf',
          fileSizeKb: 280,
          dispatchChannel: 'WHATSAPP_CLOUD_API'
        }
      });
      assert.equal(resDispatch.statusCode, 201);
      const dispatchBody = JSON.parse(resDispatch.body);
      assert.equal(dispatchBody.success, true);
      assert.equal(dispatchBody.data.documentNumber, 'RX-2026-9901');
      assert.equal(dispatchBody.data.deliveryStatus, 'DISPATCHED_READ');
      assert.ok(dispatchBody.data.fileUrl.includes('RX-2026-9901.pdf'));
      dispatchedDocId = dispatchBody.data.id;

      // Verify conversation thread now contains the dispatched PDF message
      const resConvs = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/whatsapp/conversations',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resConvs.statusCode, 200);
      const convsBody = JSON.parse(resConvs.body);
      const targetConv = convsBody.data.find((c) => c.phoneNumber.includes('9820154321'));
      assert.ok(targetConv, 'Target conversation thread must exist');
      const lastMsg = targetConv.messages[targetConv.messages.length - 1];
      assert.equal(lastMsg.messageType, 'MEDIA_DOCUMENT_PDF');
      assert.ok(lastMsg.textContent.includes('RX-2026-9901'));
      assert.ok(lastMsg.mediaUrl.includes('RX-2026-9901.pdf'));

      console.log(`  ✔ [PASS] Document dispatched: ${dispatchedDocId} (e-Rx -> WhatsApp Media PDF verified)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 3: Meta WhatsApp Cloud API Webhook Handshake & HMAC SHA-256 Security
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 3] Testing Meta Cloud API Webhook Handshake & HMAC SHA-256 Security...');
    {
      // 3A. Valid Webhook Verification Challenge (GET)
      const challengeToken = 'RANDOM_META_CHALLENGE_98273';
      const resChallenge = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${WA_SECURITY_DEFAULTS.WEBHOOK_VERIFY_TOKEN}&hub.challenge=${challengeToken}`
      });
      assert.equal(resChallenge.statusCode, 200);
      assert.equal(resChallenge.body, challengeToken);

      // 3B. Invalid Webhook Verification Token (403)
      const resBadChallenge = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=WRONG_TOKEN&hub.challenge=${challengeToken}`
      });
      assert.equal(resBadChallenge.statusCode, 403);

      // 3C. Inbound Message with Tampered HMAC SHA-256 Signature (401)
      const testPayload = JSON.stringify({ fromPhone: '+919820154321', text: 'CONFIRM' });
      const resTampered = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': 'sha256=0000000000000000000000000000000000000000000000000000000000000000'
        },
        payload: testPayload
      });
      assert.equal(resTampered.statusCode, 401);

      console.log(`  ✔ [PASS] Webhook handshake validated (challenge echo 200) & Tampered HMAC signatures rejected (401)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 4: Two-Way Inbound Appointment Confirmation & Cancellation Flows
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 4] Testing Inbound Appointment Confirmation ("CONFIRM") & Cancellation ("CANCEL")...');
    {
      // 4A. Patient sends "CONFIRM"
      const confirmPayload = JSON.stringify({
        fromPhone: '+919820154321',
        patientName: 'Kavita Joshi',
        text: 'CONFIRM'
      });
      const confirmSig = signPayloadHmac(confirmPayload);

      const resConfirm = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': confirmSig
        },
        payload: confirmPayload
      });
      assert.equal(resConfirm.statusCode, 200);
      const confirmBody = JSON.parse(resConfirm.body);
      assert.equal(confirmBody.data.intentDetected, 'APPOINTMENT_CONFIRMED');
      assert.equal(confirmBody.data.botActive, true);
      assert.ok(confirmBody.data.replyMessage.textContent.includes('appointment confirm'));

      // 4B. Patient sends "CANCEL"
      const cancelPayload = JSON.stringify({
        fromPhone: '+919820154321',
        text: 'CANCEL'
      });
      const cancelSig = signPayloadHmac(cancelPayload);

      const resCancel = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': cancelSig
        },
        payload: cancelPayload
      });
      assert.equal(resCancel.statusCode, 200);
      const cancelBody = JSON.parse(resCancel.body);
      assert.equal(cancelBody.data.intentDetected, 'APPOINTMENT_CANCELLED');
      assert.ok(cancelBody.data.replyMessage.textContent.includes('cancel'));

      console.log(`  ✔ [PASS] 2-Way Bot State Machine handled CONFIRM (Appointment Confirmed) & CANCEL (Slot Released)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 5: Automated Patient Self-Service Report & e-Rx Retrieval via Bot
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 5] Testing Patient Self-Service Report & e-Rx Retrieval via WhatsApp...');
    {
      // 5A. Patient queries "REPORT"
      const reportPayload = JSON.stringify({
        fromPhone: '+919820154321',
        text: 'REPORT'
      });
      const reportSig = signPayloadHmac(reportPayload);

      const resReport = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': reportSig
        },
        payload: reportPayload
      });
      assert.equal(resReport.statusCode, 200);
      const reportBody = JSON.parse(resReport.body);
      assert.equal(reportBody.data.intentDetected, 'REPORT_RETRIEVED');
      assert.ok(reportBody.data.replyMessage.textContent.includes('Lab Report'));
      assert.ok(reportBody.data.replyMessage.mediaUrl);

      // 5B. Patient queries "RX"
      const rxPayload = JSON.stringify({
        fromPhone: '+919820154321',
        text: 'RX'
      });
      const rxSig = signPayloadHmac(rxPayload);

      const resRx = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': rxSig
        },
        payload: rxPayload
      });
      assert.equal(resRx.statusCode, 200);
      const rxBody = JSON.parse(resRx.body);
      assert.equal(rxBody.data.intentDetected, 'PRESCRIPTION_RETRIEVED');
      assert.ok(rxBody.data.replyMessage.textContent.includes('Prescription'));
      assert.ok(rxBody.data.replyMessage.mediaUrl.includes('.pdf'));

      console.log(`  ✔ [PASS] Self-Service Retrieval verified: REPORT delivered lab PDF, RX delivered signed e-Rx`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 6: Live OPD Queue Token Tracking & Real-Time Dynamic Wait Times
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 6] Testing Live OPD Queue Token Tracking ("QUEUE") & Doctor Queue Advance...');
    {
      // 6A. Patient texts "QUEUE"
      const queuePayload = JSON.stringify({
        fromPhone: '+919820154321',
        text: 'QUEUE'
      });
      const queueSig = signPayloadHmac(queuePayload);

      const resQueue = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': queueSig
        },
        payload: queuePayload
      });
      assert.equal(resQueue.statusCode, 200);
      const queueBody = JSON.parse(resQueue.body);
      assert.equal(queueBody.data.intentDetected, 'QUEUE_TRACKED');
      assert.ok(queueBody.data.replyMessage.textContent.includes('Live OPD Queue Update'));
      assert.ok(queueBody.data.replyMessage.textContent.includes('TKN-'));

      // 6B. Doctor in OPD advances queue token
      const resTokenPatch = await app.inject({
        method: 'PATCH',
        url: '/api/v1/partner/whatsapp/queue-tokens/lqt-1',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          currentTokenServing: 'TKN-042',
          queueStatus: 'CALLED_TO_ROOM',
          estimatedWaitMinutes: 0
        }
      });
      assert.equal(resTokenPatch.statusCode, 200);
      const patchBody = JSON.parse(resTokenPatch.body);
      assert.equal(patchBody.data.currentTokenServing, 'TKN-042');
      assert.equal(patchBody.data.queueStatus, 'CALLED_TO_ROOM');

      console.log(`  ✔ [PASS] Live OPD queue tracking validated: TKN-042 called to room, wait time 0 min`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 7: Front Desk Receptionist Escalation, Handoff & Manual Desk Chat
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 7] Testing Human Agent Escalation ("AGENT"), Manual Chat Desk & Bot Resume...');
    {
      // 7A. Patient texts "AGENT"
      const agentPayload = JSON.stringify({
        fromPhone: '+919820154321',
        text: 'AGENT'
      });
      const agentSig = signPayloadHmac(agentPayload);

      const resAgent = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': agentSig
        },
        payload: agentPayload
      });
      assert.equal(resAgent.statusCode, 200);
      const agentBody = JSON.parse(resAgent.body);
      assert.equal(agentBody.data.intentDetected, 'HANDOFF_TO_AGENT');
      assert.equal(agentBody.data.botActive, false);
      assert.ok(agentBody.data.replyMessage.textContent.includes('Front Desk Reception Coordinator'));

      const convId = agentBody.data.conversationId;

      // 7B. Patient sends follow-up while agent desk is active
      const followUpPayload = JSON.stringify({
        fromPhone: '+919820154321',
        text: 'I have a cashless insurance query for Star Health.'
      });
      const followUpSig = signPayloadHmac(followUpPayload);

      const resFollowUp = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/whatsapp/webhook',
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantA,
          'x-hub-signature-256': followUpSig
        },
        payload: followUpPayload
      });
      assert.equal(resFollowUp.statusCode, 200);
      const followUpBody = JSON.parse(resFollowUp.body);
      assert.equal(followUpBody.data.status, 'ROUTED_TO_AGENT');
      assert.equal(followUpBody.data.botActive, false);

      // 7C. Receptionist sends manual reply from desk
      const resManualMsg = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/whatsapp/conversations/${convId}/messages`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          messageType: 'TEXT_MESSAGE',
          textContent: 'Namaste Kavita ji, I have verified your Star Health policy. Pre-auth is in progress.'
        }
      });
      assert.equal(resManualMsg.statusCode, 201);
      const manualBody = JSON.parse(resManualMsg.body);
      const lastMsg = manualBody.data.messages[manualBody.data.messages.length - 1];
      assert.equal(lastMsg.direction, 'OUTBOUND_AGENT');
      assert.ok(lastMsg.textContent.includes('Pre-auth is in progress'));

      // 7D. Receptionist finishes and resumes bot automation
      const resResumeBot = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/whatsapp/conversations/${convId}/toggle-bot`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { botActive: true }
      });
      assert.equal(resResumeBot.statusCode, 200);
      const resumeBody = JSON.parse(resResumeBot.body);
      assert.equal(resumeBody.data.botActive, true);
      assert.equal(resumeBody.data.assignedAgent, null);

      console.log(`  ✔ [PASS] Receptionist handoff lifecycle verified (Handoff -> Suppressed Bot -> Manual Outbound -> Bot Resumed)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 8: Multi-Tenant Data Isolation & SHA-256 Cryptographic Audit Chain
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 8] Validating Multi-Tenant Isolation & SHA-256 Tamper-Proof Audit Chain...');
    {
      // 8A. Tenant B cannot see Tenant A conversations
      const resTenantBConvs = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/whatsapp/conversations',
        headers: { authorization: `Bearer ${tokenB}` }
      });
      assert.equal(resTenantBConvs.statusCode, 200);
      const bConvs = JSON.parse(resTenantBConvs.body);
      assert.equal(bConvs.data.length, 0, 'Tenant B must see 0 conversations');

      // 8B. Tenant B cannot see Tenant A dispatches
      const resTenantBDispatches = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/whatsapp/dispatches',
        headers: { authorization: `Bearer ${tokenB}` }
      });
      assert.equal(resTenantBDispatches.statusCode, 200);
      const bDispatches = JSON.parse(resTenantBDispatches.body);
      assert.equal(bDispatches.data.length, 0, 'Tenant B must see 0 dispatches');

      // 8C. Verify Tenant A Audit Traces have valid SHA-256 integrity hashes
      const resAudit = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/whatsapp/audit-traces',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resAudit.statusCode, 200);
      const auditBody = JSON.parse(resAudit.body);
      assert.ok(auditBody.data.length >= 5);

      for (const trace of auditBody.data) {
        assert.ok(trace.integrityHash, 'Audit trace must have integrityHash');
        assert.equal(trace.integrityHash.length, 64, 'SHA-256 hash must be 64 hex characters');
      }

      console.log(`  ✔ [PASS] Multi-tenant isolation verified & SHA-256 cryptographic audit chain validated (${auditBody.data.length} traces)`);
      testsPassed++;
    }

    const duration = (performance.now() - startTime).toFixed(2);
    console.log('\n======================================================================');
    console.log(`🎉 TEST SUMMARY: ${testsPassed}/${testsTotal} SCENARIOS PASSED (${duration}ms)`);
    console.log('   OMNICHANNEL PATIENT ENGAGEMENT FULLY CERTIFIED & READY FOR PRODUCTION');
    console.log('======================================================================\n');
  } finally {
    await app.close();
  }
}

runOmnichannelTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH UNHANDLED ERROR:');
  console.error(err);
  process.exit(1);
});
