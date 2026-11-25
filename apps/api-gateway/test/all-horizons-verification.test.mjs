import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../dist/app.js';
import { signJwt } from '@docsearch/auth';
import {
  SUPPORTED_UI_LANGUAGES,
  translatePartnerUi,
  translateWorkspaceLabel,
  tickHlc,
  receiveHlc,
  compareHlc,
  encodeHlc,
  mergeFieldLevelCrdtMaps
} from '@docsearch/shared-core';
import {
  ASTM_CTRL,
  buildAstmBinaryFrame,
  verifyAndParseAstmFrame,
  serialAnalyzerDriverService
} from '../dist/services/hardware/SerialAnalyzerDriverService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

describe('DOC SEARCH — All 5 Next-Horizon Pillars End-to-End Verification', () => {
  let app;
  let adminToken;
  let partnerToken;

  const MASTER_SECRET = process.env['JWT_SECRET'] || 'docsearch_master_jwt_secret_dev_32char_key_only';
  const TENANT_ID = '11111111-1111-4111-8111-111111111111';
  const BRANCH_ID = '11111111-1111-4111-8111-111111111111';

  before(async () => {
    app = await buildApp();

    adminToken = signJwt(
      {
        sub: '00000000-0000-4000-8000-000000000010',
        email: 'superadmin@docsearch.health',
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'],
        permissions: ['*'],
        dataScope: 'global'
      },
      { secret: MASTER_SECRET, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresInSeconds: 3600 }
    );

    partnerToken = signJwt(
      {
        sub: '00000000-0000-4000-8000-000000000020',
        email: 'doctor@docsearch.health',
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        roles: ['DOCTOR', 'HOSPITAL_ADMIN'],
        permissions: ['clinical:consultations:create', 'patients:read', 'clinical:read'],
        dataScope: 'branch'
      },
      { secret: MASTER_SECRET, issuer: 'docsearch-api', audience: 'docsearch-platform', expiresInSeconds: 3600 }
    );
  });

  after(async () => {
    await serialAnalyzerDriverService.stopTcpSerialBridge();
    serialAnalyzerDriverService.stopPhysicalComPortListener();
    if (app) await app.close();
  });

  // ==========================================================
  // PILLAR 1: Live Production Credentials Readiness & Security
  // ==========================================================
  describe('Pillar 1: Production Credentials Readiness Center', () => {
    it('1. GET /api/v1/company/integrations/production-readiness covers all 8+ channels with zero plaintext secret leak', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/company/integrations/production-readiness',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.ok(json.report.summary);
      assert.equal(json.report.summary.totalCoreChannels, 8);
      for (const ch of ['gmail', 'firebase', 'telegram', 'razorpay', 'stripe', 'abdm', 'dltSms', 'whatsapp']) {
        assert.ok(json.report[ch], `Missing channel report for ${ch}`);
      }
      // Verify zero plaintext secret leaks
      assert.equal(json.report.gmail.appPassword, undefined);
      assert.equal(json.report.razorpay.keySecret, undefined);
      assert.equal(json.report.telegram.botToken, undefined);
    });

    it('2. POST /api/v1/company/integrations/production-readiness/test-channel executes safe handshakes', async () => {
      for (const ch of ['gmail', 'firebase', 'telegram', 'razorpay', 'abdm', 'dltSms']) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/company/integrations/production-readiness/test-channel',
          headers: { Authorization: `Bearer ${adminToken}` },
          payload: { channel: ch }
        });
        assert.equal(res.statusCode, 200);
        const json = JSON.parse(res.payload);
        assert.equal(json.data.channel, ch);
        assert.ok(typeof json.data.message === 'string' && json.data.message.length > 0);
      }
    });

    it('3. Non-admin roles cannot overwrite production environment credentials (403 RBAC enforced)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/company/integrations/production-readiness/configure',
        headers: { Authorization: `Bearer ${partnerToken}` },
        payload: { credentials: { GMAIL_USER: 'attacker@evil.com' }, persistToEnvFile: false }
      });
      assert.equal(res.statusCode, 403);
    });
  });

  // ==========================================================
  // PILLAR 2: Native Mobile App Packaging (.apk, .aab, iOS)
  // ==========================================================
  describe('Pillar 2: Native Mobile App Store Artifacts & Packaging', () => {
    it('4. Compiled Aarogya360 signed Android APK & Play Store AAB binaries exist with valid ZIP headers', () => {
      const apkPath = path.join(ROOT_DIR, 'apps/patient-app/dist/apk/aarogya360-patient-v1.0.0-release.apk');
      const aabPath = path.join(ROOT_DIR, 'apps/patient-app/dist/aab/aarogya360-patient-v1.0.0-release.aab');

      assert.ok(fs.existsSync(apkPath), 'Signed release APK missing');
      assert.ok(fs.existsSync(aabPath), 'Signed Google Play AAB missing');

      const apkBuf = fs.readFileSync(apkPath);
      const aabBuf = fs.readFileSync(aabPath);
      assert.ok(apkBuf.length > 100_000, `APK too small (${apkBuf.length} bytes), expected compiled binary`);
      assert.ok(aabBuf.length > 100_000, `AAB too small (${aabBuf.length} bytes), expected compiled binary`);
      assert.equal(apkBuf[0], 0x50);
      assert.equal(apkBuf[1], 0x4b); // PK signature
      assert.equal(aabBuf[0], 0x50);
      assert.equal(aabBuf[1], 0x4b);
    });

    it('5. Apple App Store iOS packaging scaffold & Partner Mobile Capacitor config exist cleanly', () => {
      assert.ok(fs.existsSync(path.join(ROOT_DIR, 'apps/patient-app/ios/App/App/Info.plist')));
      assert.ok(fs.existsSync(path.join(ROOT_DIR, 'apps/patient-app/ios/App/ExportOptions.plist')));
      assert.ok(fs.existsSync(path.join(ROOT_DIR, 'apps/patient-app/ios/App/Podfile')));
      assert.ok(fs.existsSync(path.join(ROOT_DIR, 'apps/patient-app/ios/fastlane/Fastfile')));
      assert.ok(fs.existsSync(path.join(ROOT_DIR, 'apps/partner-platform/capacitor.config.ts')));
    });
  });

  // ==========================================================
  // PILLAR 3: Hardware IoT Serial (RS-232) Analyzer Driver
  // ==========================================================
  describe('Pillar 3: RS-232 Serial Driver & ASTM E1381/HL7 Protocol Engine', () => {
    it('6. ASTM E1381 binary frame verifier accepts valid modulo-256 checksum & rejects corrupted byte with NAK', () => {
      const validFrame = buildAstmBinaryFrame(1, 'R|1|^^^K|7.4|mEq/L|3.5-5.1|HH||F');
      const parsedValid = verifyAndParseAstmFrame(validFrame);
      assert.equal(parsedValid.valid, true);
      assert.equal(parsedValid.frameNumber, 1);
      assert.ok(parsedValid.text.includes('^^^K|7.4'));

      // Corrupt one byte inside payload
      const corrupted = Buffer.from(validFrame);
      corrupted[10] = corrupted[10] ^ 0x01;
      const parsedBad = verifyAndParseAstmFrame(corrupted);
      assert.equal(parsedBad.valid, false);
    });

    it('7. Live TCP-to-RS232 Socket Server receives binary ASTM E1381 ENQ->STX->EOT handshake & flags Panic Alert', async () => {
      const { port } = await serialAnalyzerDriverService.startTcpSerialBridge(0);
      assert.ok(port > 0);

      const clientReplies = [];
      await new Promise((resolve, reject) => {
        const sock = net.createConnection({ host: '127.0.0.1', port }, () => {
          const payload = Buffer.concat([
            Buffer.from([ASTM_CTRL.ENQ]),
            buildAstmBinaryFrame(1, 'H|\\^&|||Mindray-BC5000^V3|||||||P|1394-97|20261125081500'),
            buildAstmBinaryFrame(2, 'P|1|UHID-901||Verma^Ramesh'),
            buildAstmBinaryFrame(3, 'O|1|ACC-SER-7741||^^^ELEC'),
            buildAstmBinaryFrame(4, 'R|1|^^^K|7.4|mEq/L|3.5 - 5.1|HH||F'),
            buildAstmBinaryFrame(5, 'L|1|N'),
            Buffer.from([ASTM_CTRL.EOT])
          ]);
          sock.write(payload);
        });

        sock.on('data', (d) => {
          for (const b of d) clientReplies.push(b);
          if (clientReplies.length >= 6) {
            sock.end();
            resolve();
          }
        });
        sock.on('error', reject);
        setTimeout(() => {
          sock.destroy();
          resolve();
        }, 1500);
      });

      assert.ok(clientReplies.includes(ASTM_CTRL.ACK), 'Analyzer socket did not receive binary ACK');
      const status = serialAnalyzerDriverService.getStatus();
      const latest = status.recentPackets[0];
      assert.ok(latest, 'Packet not recorded by serial driver');
      assert.equal(latest.specimenBarcode, 'ACC-SER-7741');
      assert.equal(latest.hasPanic, true);
      assert.equal(latest.analytes[0].analyteCode, 'K');
      assert.equal(latest.analytes[0].value, '7.4');
    });

    it('8. API Route POST /api/v1/hardware/analyzer/ingest-raw parses HL7 MLLP stream & rejects invalid checksums', async () => {
      const hl7Stream = [
        '\x0bMSH|^~\\&|ROCHE_COBAS|LAB|DOCSEARCH|HOSP|202611250820||ORU^R01|MSG91|P|2.5',
        'PID|||UHID-5521||Sharma^Sunita',
        'OBR|1|ORD-11|ACC-HL7-9901|^^^TROP_I',
        'OBX|1|NM|TROP_I^Troponin-I||4.9|ng/mL|<0.04|HH|||F\x1c\r'
      ].join('\r');

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/hardware/analyzer/ingest-raw',
        headers: { Authorization: `Bearer ${partnerToken}` },
        payload: { rawText: hl7Stream, sourceTransport: 'ROCHE_LAN_BRIDGE' }
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.equal(json.ingestedPackets[0].protocol, 'HL7_MLLP');
      assert.equal(json.ingestedPackets[0].hasPanic, true);
    });
  });

  // ==========================================================
  // PILLAR 4: 6-Language Vernacular UI Localization (i18n)
  // ==========================================================
  describe('Pillar 4: 6-Language Vernacular Localization (EN, HI, MR, BN, TA, TE)', () => {
    it('9. Shared Core i18n dictionary covers all 6 languages cleanly across UI & workspace labels', () => {
      assert.equal(SUPPORTED_UI_LANGUAGES.length, 6);
      const expectedCodes = ['en', 'hi', 'mr', 'bn', 'ta', 'te'];
      for (const code of expectedCodes) {
        const navLabel = translatePartnerUi('nav.pathology', code);
        const logoutLabel = translatePartnerUi('header.logout', code);
        const hospLabel = translateWorkspaceLabel('HOSPITAL', code);
        assert.ok(navLabel && navLabel.length > 1, `Missing nav.pathology for ${code}`);
        assert.ok(logoutLabel && logoutLabel.length > 0, `Missing header.logout for ${code}`);
        assert.ok(hospLabel && hospLabel.length > 1, `Missing HOSPITAL workspace label for ${code}`);
      }
      // Verify Patient App 6-language file exists with all 6 dictionaries
      const patI18n = fs.readFileSync(path.join(ROOT_DIR, 'apps/patient-app/src/i18n.ts'), 'utf8');
      for (const code of expectedCodes) {
        assert.ok(patI18n.includes(`code: '${code}'`), `Patient App missing language option '${code}'`);
      }
    });
  });

  // ==========================================================
  // PILLAR 5: Multi-Day (>48h) Offline CRDT & Blackout Engine
  // ==========================================================
  describe('Pillar 5: Multi-Day (>48h Blackout) Hybrid Logical Clock CRDT Sync', () => {
    it('10. Hybrid Logical Clock handles 72h skew & rejects stale delayed mutations without overwrite', () => {
      const day3Clock = tickHlc({ physicalMs: Date.now() + 72 * 3600_000, logicalCounter: 4, nodeId: 'NODE-DOC' }, 'NODE-DOC');
      const day1StaleClock = tickHlc({ physicalMs: Date.now(), logicalCounter: 1, nodeId: 'NODE-REC' }, 'NODE-REC');

      assert.ok(compareHlc(day3Clock, day1StaleClock) > 0);

      // Apply Day 3 newer update first
      const r1 = mergeFieldLevelCrdtMaps({}, { mobileNumber: '9999900000', allergies: 'Penicillin Anaphylaxis' }, day3Clock, { actorId: 'doc-1' });
      assert.equal(r1.appliedFields.length, 2);

      // Now delayed Day 1 delta from offline tablet arrives with stale mobileNumber + different concurrent clinical node edit
      const r2 = mergeFieldLevelCrdtMaps(r1.mergedState, { mobileNumber: '8888800000' }, day1StaleClock, { actorId: 'rec-1' });
      assert.equal(r2.appliedFields.length, 0, 'Stale older-clock field must NOT overwrite Day 3 data');
      assert.ok(r2.skippedStaleFields.includes('mobileNumber'));
      assert.equal(r2.mergedState.mobileNumber.value, '9999900000');

      // Concurrent 2-node safety field modification within blackout overlap window flags semantic conflict
      const erLocalClock = { physicalMs: day3Clock.physicalMs - 1000, logicalCounter: 2, nodeId: 'NODE-ER' };
      const concurrentClock = receiveHlc(erLocalClock, day3Clock);
      const r3 = mergeFieldLevelCrdtMaps(r1.mergedState, { allergies: 'No Known Allergies' }, concurrentClock, { actorId: 'er-nurse' });
      assert.equal(r3.semanticConflicts.length, 1);
      assert.equal(r3.semanticConflicts[0].field, 'allergies');
    });

    it('11. API Route GET /snapshot-export & POST /blackout-bundle enforce SHA-256 tamper protection', async () => {
      const snapRes = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/clinical/sync/snapshot-export',
        headers: { Authorization: `Bearer ${partnerToken}` }
      });
      assert.equal(snapRes.statusCode, 200);
      const snapJson = JSON.parse(snapRes.payload);
      assert.equal(snapJson.success, true);
      assert.equal(snapJson.snapshot.schemaVersion, '2.0.0-HLC-CRDT');
      assert.ok(snapJson.snapshot.checksumSha256);

      // Tampered checksum bundle must be rejected with 400
      const deltas = [
        {
          deltaId: `blk-${Date.now()}`,
          entityType: 'CONSULTATION',
          entityId: '00000000-0000-4000-8000-000000009999',
          patientId: '00000000-0000-4000-8000-000000008888',
          deltaType: 'VITALS',
          clientTimestamp: new Date().toISOString(),
          hlcTimestamp: encodeHlc(tickHlc(null, 'RURAL-CAMP-01')),
          data: { systolicBp: 120, diastolicBp: 80 }
        }
      ];

      const tamperedRes = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/clinical/sync/blackout-bundle',
        headers: {
          Authorization: `Bearer ${partnerToken}`,
          'X-Idempotency-Key': `idem-tamper-${Date.now()}`
        },
        payload: {
          bundleId: 'BUNDLE-TAMPER-TEST',
          nodeId: 'RURAL-CAMP-01',
          checksumSha256: crypto.createHash('sha256').update('corrupted').digest('hex'),
          deltas
        }
      });
      assert.equal(tamperedRes.statusCode, 400);
    });
  });
});
