import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { signJwt } from '@docsearch/auth';
import { gmailMailerService } from '../dist/services/communication/GmailMailerService.js';
import { firebaseIntegrationService } from '../dist/services/communication/FirebaseIntegrationService.js';
import { telegramBotService } from '../dist/services/communication/TelegramBotService.js';
import { buildApp } from '../dist/app.js';
import fs from 'node:fs';

const TEST_JWT_SECRET = process.env['JWT_SECRET'] || 'docsearch_master_jwt_secret_dev_32char_key_only';

function mintAdminHeaders() {
  const token = signJwt(
    {
      sub: 'usr_omnichannel_test_001',
      email: 'admin@docsearch.health',
      tenantId: '11111111-1111-4111-8111-111111111111',
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
      isSuperAdmin: true
    },
    {
      secret: TEST_JWT_SECRET,
      issuer: process.env['JWT_ISSUER'] || 'docsearch-api',
      audience: process.env['JWT_AUDIENCE'] || 'docsearch-platform',
      expiresInSeconds: 3600
    }
  );
  return { Authorization: `Bearer ${token}` };
}

describe('Omnichannel Communication Integrations: Gmail, Firebase & Telegram (23-Test Suite)', () => {
  let app;
  let authHeaders;

  before(async () => {
    process.env['JWT_SECRET'] = TEST_JWT_SECRET;
    authHeaders = mintAdminHeaders();
    app = await buildApp();
  });

  after(async () => {
    if (app) await app.close();
  });

  // ==========================================
  // SECTION 1: Unified Integration Status
  // ==========================================
  describe('Unified Status Matrix', () => {
    it('1. GET /api/v1/integrations/status returns aggregated status for all channels', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/integrations/status'
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.integrations.gmail);
      assert.ok(json.integrations.firebase);
      assert.ok(json.integrations.telegram);
      assert.ok(['GMAIL_SMTP', 'LOCAL_SIMULATION'].includes(json.integrations.gmail.mode));
      assert.ok(['FIREBASE_LIVE', 'SIMULATED'].includes(json.integrations.firebase.mode));
      assert.ok(['TELEGRAM_API', 'SIMULATED'].includes(json.integrations.telegram.mode));
    });
  });

  // ==========================================
  // SECTION 2: Gmail & Google Workspace
  // ==========================================
  describe('Gmail & Google Workspace Integration', () => {
    it('2. GET /api/v1/integrations/gmail/status returns Gmail configuration status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/integrations/gmail/status'
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(typeof json.data.configured === 'boolean');
    });

    it('3. POST /api/v1/integrations/gmail/send-otp rejects unauthenticated callers (401) and dispatches OTP email when authenticated', async () => {
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/gmail/send-otp',
        payload: { toEmail: 'patient.test@example.com', otp: '782914' }
      });
      assert.equal(unauthRes.statusCode, 401);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/gmail/send-otp',
        headers: authHeaders,
        payload: {
          toEmail: 'patient.test@example.com',
          otp: '782914',
          expiresMinutes: 10
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.messageId);
      assert.equal(json.result.recipient, 'patient.test@example.com');
      assert.ok(json.result.previewPath);
      assert.ok(fs.existsSync(json.result.previewPath));
    });

    it('4. POST /api/v1/integrations/gmail/send-appointment dispatches OPD confirmation email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/gmail/send-appointment',
        headers: authHeaders,
        payload: {
          toEmail: 'patient.john@example.com',
          patientName: 'John Doe',
          doctorName: 'Ewan Babu',
          hospitalName: 'DocSearch Super Specialty Hospital',
          tokenNumber: '14',
          slotTime: '10:30 AM',
          date: '2026-11-25'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.subject.includes('Token #14'));
      assert.ok(json.result.subject.includes('Dr. Ewan Babu'));
    });

    it('5. POST /api/v1/integrations/gmail/send-lab-report dispatches NABL diagnostic report ready notification', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/gmail/send-lab-report',
        headers: authHeaders,
        payload: {
          toEmail: 'patient.lab@example.com',
          patientName: 'Anita Sharma',
          testName: 'Complete Blood Count (CBC) with Platelets',
          labName: 'Ewan Diagnostics & Pathology Hub',
          reportId: 'NABL-2026-CBC-9921',
          downloadUrl: 'http://localhost:5174/lab-reports/download?id=NABL-2026-CBC-9921'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.subject.includes('Complete Blood Count'));
    });

    it('6. POST /api/v1/integrations/gmail/send-critical-alert dispatches mandatory panic value alert to clinician', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/gmail/send-critical-alert',
        headers: authHeaders,
        payload: {
          doctorEmail: 'dr.ewan@docsearch.internal',
          patientName: 'Ramesh Verma',
          patientUhId: 'UHID-98214',
          parameterName: 'Serum Potassium (K+)',
          observedValue: '7.2 mEq/L (PANIC HIGH)',
          normalRange: '3.5 - 5.1 mEq/L',
          technicianName: 'Sunita Deshmukh (Senior Lab Tech)'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.subject.includes('CRITICAL PANIC LAB VALUE'));
    });

    it('7. Direct GmailMailerService.sendOtpEmail generates valid HTML in local mail inbox', async () => {
      const result = await gmailMailerService.sendOtpEmail('direct.doctor@example.com', '998811');
      assert.equal(result.success, true);
      assert.ok(result.previewPath);
      const htmlContent = fs.readFileSync(result.previewPath, 'utf8');
      assert.ok(htmlContent.includes('998811'));
      assert.ok(htmlContent.includes('DocSearch Healthcare'));
    });
  });

  // ==========================================
  // SECTION 3: Firebase Cloud Messaging & Auth
  // ==========================================
  describe('Firebase Integration', () => {
    it('8. GET /api/v1/integrations/firebase/status returns Firebase service status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/integrations/firebase/status'
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(['FIREBASE_LIVE', 'SIMULATED'].includes(json.data.mode));
    });

    it('9. POST /api/v1/integrations/firebase/register-device rejects unauthenticated callers (401) and registers device token when authenticated', async () => {
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/firebase/register-device',
        payload: { userId: 'usr_patient_001', token: 'fcm_token_sample_abc123xyz789', platform: 'ANDROID' }
      });
      assert.equal(unauthRes.statusCode, 401);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/firebase/register-device',
        headers: authHeaders,
        payload: {
          userId: 'usr_patient_001',
          token: 'fcm_token_sample_abc123xyz789',
          platform: 'ANDROID',
          role: 'PATIENT'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.equal(json.data.userId, 'usr_patient_001');
      assert.equal(json.data.platform, 'ANDROID');
    });

    it('10. POST /api/v1/integrations/firebase/send-queue-turn dispatches real-time OPD token call', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/firebase/send-queue-turn',
        headers: authHeaders,
        payload: {
          deviceToken: 'fcm_token_sample_abc123xyz789',
          tokenNumber: 22,
          patientName: 'Vikas Kumar',
          doctorName: 'Ewan Babu',
          cabinNumber: 3
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.notification.title.includes('Token #22'));
      assert.ok(json.result.notification.body.includes('Cabin 3'));
      assert.equal(json.result.notification.data.type, 'OPD_TOKEN_CALL');
    });

    it('11. POST /api/v1/integrations/firebase/send-critical-lab-alert sends panic lab push to clinician', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/firebase/send-critical-lab-alert',
        headers: authHeaders,
        payload: {
          doctorDeviceToken: 'fcm_doc_token_111',
          patientName: 'Sunil Mehta',
          uhid: 'UHID-8821',
          testName: 'Troponin-I',
          panicValue: '4.8 ng/mL (High)'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.notification.title.includes('CRITICAL LAB ALERT'));
      assert.equal(json.result.notification.data.action, 'OPEN_LIMS_PANIC_DESK');
    });

    it('12. POST /api/v1/integrations/firebase/broadcast-code-blue broadcasts emergency push', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/firebase/broadcast-code-blue',
        headers: authHeaders,
        payload: {
          roomNumber: 'ICU-Bed-4',
          wing: 'Cardiac ICU',
          floor: '2nd Floor'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.notification.title.includes('CODE BLUE EMERGENCY'));
      assert.equal(json.result.target, '/topics/emergency_code_blue');
    });

    it('13. POST /api/v1/integrations/firebase/verify-token verifies and decodes Firebase ID Token claims', async () => {
      const fakeHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const fakePayload = Buffer.from(
        JSON.stringify({
          sub: 'firebase_usr_9988',
          email: 'firebase.user@gmail.com',
          name: 'Firebase Test User',
          auth_time: 1700000000
        })
      ).toString('base64url');
      const fakeToken = `${fakeHeader}.${fakePayload}.sample_sig`;

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/firebase/verify-token',
        headers: authHeaders,
        payload: { idToken: fakeToken }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.equal(json.user.uid, 'firebase_usr_9988');
      assert.equal(json.user.email, 'firebase.user@gmail.com');
    });
  });

  // ==========================================
  // SECTION 4: Telegram Healthcare Bot
  // ==========================================
  describe('Telegram Healthcare Bot Integration', () => {
    it('14. GET /api/v1/integrations/telegram/status returns Telegram bot configuration status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/integrations/telegram/status'
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(['TELEGRAM_API', 'SIMULATED'].includes(json.data.mode));
    });

    it('15. POST /api/v1/integrations/telegram/send-message sends telegram message when authenticated', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/telegram/send-message',
        headers: authHeaders,
        payload: {
          chatId: 987654321,
          text: '🏥 <b>DocSearch System Health:</b> All services operational.'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.messageId);
      assert.equal(json.result.chatId, 987654321);
    });

    it('16. POST /api/v1/integrations/telegram/send-panic-alert rejects unauthenticated callers (401) and formats clinical panic message when authenticated', async () => {
      const unauthRes = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/telegram/send-panic-alert',
        payload: { chatId: 987654321, patientName: 'Gopal', parameterName: 'Platelet Count', observedValue: '18,000' }
      });
      assert.equal(unauthRes.statusCode, 401);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/telegram/send-panic-alert',
        headers: authHeaders,
        payload: {
          chatId: 987654321,
          patientName: 'Gopal Krishnan',
          uhid: 'UHID-9921',
          parameterName: 'Platelet Count',
          observedValue: '18,000 /uL (CRITICAL LOW)',
          normalRange: '150,000 - 450,000 /uL',
          technicianName: 'Sunita Deshmukh'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.formattedText.includes('CRITICAL PANIC LAB VALUE ALERT'));
      assert.ok(json.result.formattedText.includes('Gopal Krishnan'));
    });

    it('17. POST /api/v1/integrations/telegram/send-queue-alert sends OPD queue reminder to patient chat', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/telegram/send-queue-alert',
        headers: authHeaders,
        payload: {
          chatId: 987654321,
          tokenNumber: 31,
          patientName: 'Priya Sharma',
          doctorName: 'Ewan Babu',
          cabinNumber: 2,
          hospitalName: 'DocSearch Hospital'
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.formattedText.includes('TOKEN #31 — YOUR TURN IS NEXT!'));
    });

    it('18. POST /api/v1/integrations/telegram/send-onboarding-alert sends admin notification for new partner', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/telegram/send-onboarding-alert',
        headers: authHeaders,
        payload: {
          chatId: 987654321,
          legalName: 'Apex Heart & Diagnostics Centre',
          vertical: 'HOSPITAL',
          city: 'Mumbai',
          tenantId: 'tenant-apex-001',
          autoApproved: true
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.result.formattedText.includes('Apex Heart & Diagnostics'));
      assert.ok(json.result.formattedText.includes('AUTO-APPROVED'));
    });

    it('19. POST /api/v1/integrations/telegram/webhook processes /start and replies with menu', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/integrations/telegram/webhook',
        payload: {
          update_id: 10001,
          message: {
            message_id: 1,
            from: { id: 987654321, is_bot: false, first_name: 'Dr. Ewan' },
            chat: { id: 987654321, type: 'private' },
            date: Math.floor(Date.now() / 1000),
            text: '/start'
          }
        }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.ok, true);
      assert.equal(json.processed, true);
      assert.equal(json.replySentTo, 987654321);
    });

    it('20. TelegramBotService.processWebhookUpdate handles /token and /emergency queries', () => {
      // Test /token command
      const tokenReply = telegramBotService.processWebhookUpdate({
        update_id: 10002,
        message: {
          message_id: 2,
          from: { id: 12345, is_bot: false, first_name: 'Patient' },
          chat: { id: 12345, type: 'private' },
          date: 1700000000,
          text: '/token 42'
        }
      });
      assert.ok(tokenReply);
      assert.ok(tokenReply.text.includes('Token #42'));

      // Test /emergency command
      const emergencyReply = telegramBotService.processWebhookUpdate({
        update_id: 10003,
        message: {
          message_id: 3,
          from: { id: 12345, is_bot: false, first_name: 'Patient' },
          chat: { id: 12345, type: 'private' },
          date: 1700000000,
          text: '/emergency'
        }
      });
      assert.ok(emergencyReply);
      assert.ok(emergencyReply.text.includes('EMERGENCY & TRAUMA DESK'));
    });
  });
});
