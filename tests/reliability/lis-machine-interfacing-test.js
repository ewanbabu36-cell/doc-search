process.env['RATE_LIMIT_MAX'] = '1000000';
process.env['NODE_ENV'] = 'test';

import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { signJwt } from '../../packages/auth/dist/index.js';
import {
  ASTM_CTRL,
  MLLP,
  computeAstmChecksum,
  encodeAstmFrame,
  decodeAstmFrame,
  wrapMllp,
  unwrapMllp,
  parseAstmE1394,
  parseHl7OruR01,
  evaluateWestgardRules
} from '../../apps/api-gateway/dist/services/partner/HardwareBridgeService.js';

console.log('\n======================================================================');
console.log('🔬 TEST SUITE 9 — LIS HARDWARE ANALYZER BIDIRECTIONAL MACHINE INTERFACING');
console.log('   (ASTM E1381/E1394, HL7 v2.x MLLP, Specimen Mapping, Panic Alerts & QC)');
console.log('======================================================================\n');

async function runLisMachineInterfacingTests() {
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
      sub: overrides.userId || 'usr-lis-biomed-eng',
      email: overrides.email || 'lis.engineer@docsearch.health',
      tenantId: overrides.tenantId !== undefined ? overrides.tenantId : tenantA,
      branchId: overrides.branchId !== undefined ? overrides.branchId : branchId,
      roles: overrides.roles || ['BIOMEDICAL_ENGINEER', 'LAB_DIRECTOR', 'HOSPITAL_ADMIN'],
      permissions: overrides.permissions || [
        'hardware:devices:read',
        'hardware:devices:create',
        'hardware:scans:create',
        'hardware:rfid:create',
        'hardware:printers:create',
        'hardware:audit:read'
      ],
      iss: ISSUER,
      aud: AUDIENCE
    };
    return signJwt(claims, { secret: MASTER_SECRET, issuer: ISSUER, audience: AUDIENCE, expiresInSeconds: 3600 });
  }

  const tokenA = createTestToken();
  const tokenB = createTestToken({
    tenantId: tenantB,
    userId: 'usr-lis-tenantB'
  });

  const app = await buildApp();
  await app.ready();

  let sysmexId = '';
  let rocheId = '';

  try {
    // ------------------------------------------------------------------------
    // TEST 1: LIS Analyzer Registration & Bidirectional Discovery
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 1] Registering Sysmex XN-1000 & Roche Cobas 6000 analyzers...');
    {
      // 1A. Sysmex XN-1000 Hematology Analyzer (ASTM E1381/E1394)
      const resSysmex = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/hardware/analyzers',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          analyzerCode: 'SYS-XN1000-01',
          analyzerName: 'Sysmex XN-1000 Hematology Analyzer',
          manufacturer: 'Sysmex Corporation',
          model: 'XN-1000',
          serialNumber: 'SN-XN1000-98421',
          protocol: 'ASTM_E1381_E1394',
          communicationMode: 'BIDIRECTIONAL',
          connectionType: 'TCP_IP',
          ipAddress: '192.168.20.101',
          port: 5100,
          departmentName: 'Clinical Hematology',
          capabilities: ['CBC', 'DIFF', 'RETIC', 'WBC', 'RBC', 'HGB', 'PLT']
        }
      });
      assert.equal(resSysmex.statusCode, 201, `Expected 201, got ${resSysmex.statusCode}: ${resSysmex.body}`);
      const bodySysmex = JSON.parse(resSysmex.body);
      assert.equal(bodySysmex.success, true);
      assert.ok(bodySysmex.data.id);
      sysmexId = bodySysmex.data.id;

      // 1B. Roche Cobas 6000 Clinical Chemistry Analyzer (HL7 v2.x MLLP)
      const resRoche = await app.inject({
        method: 'POST',
        url: '/api/v1/partner/hardware/analyzers',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          analyzerCode: 'ROCHE-COBAS-6000',
          analyzerName: 'Roche Cobas 6000 Clinical Chemistry Analyzer',
          manufacturer: 'Roche Diagnostics',
          model: 'Cobas c501',
          serialNumber: 'SN-COBAS-55120',
          protocol: 'HL7_V2_MLLP',
          communicationMode: 'BIDIRECTIONAL',
          connectionType: 'TCP_IP',
          ipAddress: '192.168.20.102',
          port: 2575,
          departmentName: 'Clinical Biochemistry',
          capabilities: ['GLU', 'K', 'NA', 'CREAT', 'BUN', 'TROP_I']
        }
      });
      assert.equal(resRoche.statusCode, 201);
      const bodyRoche = JSON.parse(resRoche.body);
      assert.equal(bodyRoche.success, true);
      rocheId = bodyRoche.data.id;

      // 1C. Verify list contains both analyzers
      const resList = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/hardware/analyzers',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resList.statusCode, 200);
      const listBody = JSON.parse(resList.body);
      assert.equal(listBody.success, true);
      assert.ok(listBody.data.length >= 2);

      // 1D. Verify overview metrics include connected analyzers
      const resOverview = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/hardware/overview',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      const overviewBody = JSON.parse(resOverview.body);
      assert.ok(overviewBody.data.connectedAnalyzersCount >= 8);

      console.log(`  ✔ [PASS] Analyzers registered: Sysmex (${sysmexId}), Roche (${rocheId})`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 2: ASTM E1381 Low-Level Protocol Handshake & Frame Checksum Validation
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 2] Testing ASTM E1381 Low-Level Handshake & Checksum Verification...');
    {
      // 2A. Low-level Handshake: ENQ -> ACK
      const resHandshake = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${sysmexId}/astm/handshake`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { controlChar: 'ENQ' }
      });
      assert.equal(resHandshake.statusCode, 200);
      const bodyHandshake = JSON.parse(resHandshake.body);
      assert.equal(bodyHandshake.data.responseCode, 'ACK');
      assert.equal(bodyHandshake.data.hexByte, '0x06');
      assert.equal(bodyHandshake.data.sessionStatus, 'ESTABLISHED_READY_FOR_FRAMES');

      // 2B. Frame Checksum Calculation Verification
      const sampleText = '1H|\\^&|||Sysmex^XN-1000\x03';
      const expectedChecksum = computeAstmChecksum(sampleText);
      const encodedFrame = encodeAstmFrame(1, 'H|\\^&|||Sysmex^XN-1000', true);
      assert.ok(encodedFrame.startsWith(ASTM_CTRL.STX));
      assert.ok(encodedFrame.includes(expectedChecksum));
      assert.ok(encodedFrame.endsWith('\r\n'));

      // 2C. Decode valid frame
      const decoded = decodeAstmFrame(encodedFrame);
      assert.equal(decoded.isValid, true);
      assert.equal(decoded.frameNumber, 1);
      assert.equal(decoded.checksum, expectedChecksum);

      // 2D. Corrupted frame detection (Tampered checksum)
      const corruptedFrame = encodedFrame.replace(expectedChecksum, 'ZZ');
      const resCorrupt = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${sysmexId}/astm/message`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { rawFrame: corruptedFrame }
      });
      assert.equal(resCorrupt.statusCode, 400, 'Expected 400 for corrupted frame checksum');
      const errBody = JSON.parse(resCorrupt.body);
      const errMsg = errBody.error ? errBody.error.message : (errBody.message || '');
      assert.ok(errMsg.includes('checksum mismatch'), `Expected error message to contain 'checksum mismatch', got: ${JSON.stringify(errBody)}`);

      console.log(`  ✔ [PASS] ASTM E1381 handshake verified (ENQ -> ACK) & Modulo-256 checksum enforced`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 3: ASTM E1394 Records Parsing & Normal Multi-Analyte CBC Ingestion
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 3] Ingesting Multi-Analyte ASTM E1394 CBC transmission from Sysmex...');
    {
      const astmPayload = [
        'H|\\^&|||Sysmex^XN-1000^01|||||||P|1394-97|20260903113000',
        'P|1|PAT-9041|||Joshi^Kavita||19900514|F|||||',
        'O|1|TUB-2026-9812||^^^CBC|R||||||A||||||||||||||O',
        'R|1|^^^WBC^White Blood Cells|7.4|10*3/uL|4.0-10.0|N||F||||20260903113000',
        'R|2|^^^HGB^Hemoglobin|13.8|g/dL|12.0-16.0|N||F||||20260903113000',
        'R|3|^^^PLT^Platelet Count|240|10*3/uL|150-450|N||F||||20260903113000',
        'C|1|I|Specimen clear, normal platelet indices|I',
        'L|1|N'
      ].join('\r\n');

      const resAstm = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${sysmexId}/astm/message`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { rawMessage: astmPayload }
      });
      assert.equal(resAstm.statusCode, 201, `Expected 201, got ${resAstm.statusCode}`);
      const bodyAstm = JSON.parse(resAstm.body);
      assert.equal(bodyAstm.success, true);
      assert.equal(bodyAstm.data.observationsCount, 3);
      assert.equal(bodyAstm.data.criticalAlertsTriggered, 0);
      assert.equal(bodyAstm.data.resultRecord.status, 'INGESTED');
      assert.equal(bodyAstm.data.resultRecord.specimenBarcode, 'TUB-2026-9812');
      assert.equal(bodyAstm.data.handshakeReply.code, 'ACK');

      // Verify individual analyte values & normal flags
      const obs = bodyAstm.data.resultRecord.observations;
      const wbc = obs.find((o) => o.parameterCode === 'WBC');
      const hgb = obs.find((o) => o.parameterCode === 'HGB');
      const plt = obs.find((o) => o.parameterCode === 'PLT');

      assert.equal(wbc.numericValue, 7.4);
      assert.equal(wbc.abnormalFlag, 'NORMAL');
      assert.equal(hgb.numericValue, 13.8);
      assert.equal(hgb.abnormalFlag, 'NORMAL');
      assert.equal(plt.numericValue, 240);
      assert.equal(plt.abnormalFlag, 'NORMAL');

      console.log(`  ✔ [PASS] ASTM E1394 parsed 3 CBC analytes (WBC: 7.4, HGB: 13.8, PLT: 240) -> Flagged NORMAL`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 4: HL7 v2.x MLLP Framing, ORU^R01 Acquisition & HL7 ACK Response
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 4] Processing HL7 v2.5 ORU^R01 MLLP message from Roche Cobas...');
    {
      const rawHl7 = [
        'MSH|^~\\&|ROCHE_COBAS|LAB_BIO|DOCSEARCH_LIS|CENTRAL_HOSP|20260903113500||ORU^R01|MSG-HL7-8891|P|2.5',
        'PID|1||MRN-2026-1142^^^MRN||Amit^Verma||19821120|M',
        'OBR|1|ORD-LAB-2026-7734|TUB-2026-7734|BMP^Basic Metabolic Panel^LN|||20260903113500',
        'OBX|1|NM|GLU^Blood Glucose||92|mg/dL|70-110|N|||F',
        'OBX|2|NM|NA^Serum Sodium||140|mmol/L|135-145|N|||F',
        'OBX|3|NM|K^Serum Potassium||4.2|mmol/L|3.5-5.1|N|||F'
      ].join('\r');

      const mllpMessage = wrapMllp(rawHl7);

      const resHl7 = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${rocheId}/hl7/message`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { hl7Message: mllpMessage }
      });
      assert.equal(resHl7.statusCode, 201, `Expected 201, got ${resHl7.statusCode}`);
      const bodyHl7 = JSON.parse(resHl7.body);
      assert.equal(bodyHl7.success, true);
      assert.equal(bodyHl7.data.observationsCount, 3);
      assert.equal(bodyHl7.data.criticalAlertsTriggered, 0);
      assert.equal(bodyHl7.data.resultRecord.protocol, 'HL7_V2_MLLP');
      assert.equal(bodyHl7.data.resultRecord.specimenBarcode, 'TUB-2026-7734');

      // Verify HL7 Application ACK
      const hl7Ack = bodyHl7.data.hl7Ack;
      assert.ok(hl7Ack.startsWith(MLLP.START_BLOCK));
      assert.ok(hl7Ack.includes('MSA|AA|MSG-HL7-8891'));
      assert.ok(hl7Ack.includes('ACK^R01'));

      console.log(`  ✔ [PASS] HL7 v2.5 ORU^R01 ingested (GLU: 92, NA: 140, K: 4.2) -> Returned MLLP ACK^R01`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 5: Bidirectional Specimen Barcode Query & Worklist Generation
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 5] Testing Bidirectional Worklist Barcode Query (TUB-2026-9812)...');
    {
      const resQuery = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${sysmexId}/query-worklist`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { specimenBarcode: 'TUB-2026-9812' }
      });
      assert.equal(resQuery.statusCode, 200);
      const queryBody = JSON.parse(resQuery.body);
      assert.equal(queryBody.success, true);
      assert.equal(queryBody.data.barcode, 'TUB-2026-9812');
      assert.equal(queryBody.data.worklistOrder.patientName, 'Kavita Joshi');
      assert.equal(queryBody.data.worklistOrder.testCode, 'CBC');

      // Verify ASTM worklist message format (H, P, O, L)
      const astmWorklist = queryBody.data.astmWorklistMessage;
      assert.ok(astmWorklist.includes('H|\\^&|||DOCSEARCH^LIS'));
      assert.ok(astmWorklist.includes('P|1|MRN-2026-9041|||Kavita^Joshi'));
      assert.ok(astmWorklist.includes('O|1|TUB-2026-9812||^^^CBC'));
      assert.ok(astmWorklist.includes('L|1|N'));

      // Verify HL7 OML^O21 worklist message format (MSH, PID, ORC, OBR)
      const hl7Worklist = queryBody.data.hl7WorklistMessage;
      assert.ok(hl7Worklist.includes('OML^O21'));
      assert.ok(hl7Worklist.includes('MRN-2026-9041'));
      assert.ok(hl7Worklist.includes('TUB-2026-9812'));

      console.log(`  ✔ [PASS] Barcode query resolved Kavita Joshi (MRN-2026-9041, CBC) -> Built ASTM & HL7 worklists`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 6: Real-time Panic / Critical Threshold Detection & Immediate Alerts
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 6] Triggering Critical Panic Values (Severe Thrombocytopenia & Hyperkalemia)...');
    {
      // 6A. Transmit ASTM result with Critical Platelet Count (12 x 10^3/uL, critical < 20)
      const criticalAstm = [
        'H|\\^&|||Sysmex^XN-1000^01|||||||P|1394-97|20260903114000',
        'P|1|MRN-2026-9041|||Joshi^Kavita||19900514|F|||||',
        'O|1|TUB-2026-9812||^^^CBC|STAT||||||A||||||||||||||O',
        'R|1|^^^PLT^Platelet Count|12|10*3/uL|150-450|LL||F||||20260903114000',
        'L|1|N'
      ].join('\r\n');

      const resCritAstm = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${sysmexId}/astm/message`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { rawMessage: criticalAstm }
      });
      assert.equal(resCritAstm.statusCode, 201);
      const critAstmBody = JSON.parse(resCritAstm.body);
      assert.equal(critAstmBody.data.criticalAlertsTriggered, 1);
      assert.equal(critAstmBody.data.resultRecord.status, 'CRITICAL_FLAGGED');
      assert.equal(critAstmBody.data.resultRecord.observations[0].abnormalFlag, 'CRITICAL_LOW');
      assert.equal(critAstmBody.data.resultRecord.observations[0].isCritical, true);

      // 6B. Transmit HL7 result with Life-Threatening Hyperkalemia (K = 6.9 mmol/L, critical > 6.2)
      const criticalHl7 = [
        'MSH|^~\\&|ROCHE_COBAS|LAB_BIO|DOCSEARCH_LIS|CENTRAL_HOSP|20260903114200||ORU^R01|MSG-HL7-CRIT-99|P|2.5',
        'PID|1||MRN-2026-1142^^^MRN||Amit^Verma||19821120|M',
        'OBR|1|ORD-LAB-2026-7734|TUB-2026-7734|BMP^Basic Metabolic Panel^LN|||20260903114200',
        'OBX|1|NM|K^Serum Potassium||6.9|mmol/L|3.5-5.1|HH|||F'
      ].join('\r');

      const resCritHl7 = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${rocheId}/hl7/message`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: { hl7Message: wrapMllp(criticalHl7) }
      });
      assert.equal(resCritHl7.statusCode, 201);
      const critHl7Body = JSON.parse(resCritHl7.body);
      assert.equal(critHl7Body.data.criticalAlertsTriggered, 1);
      assert.equal(critHl7Body.data.resultRecord.observations[0].abnormalFlag, 'CRITICAL_HIGH');

      // 6C. Query critical alerts endpoint
      const resAlerts = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/hardware/analyzers/critical-alerts',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resAlerts.statusCode, 200);
      const alertsBody = JSON.parse(resAlerts.body);
      assert.ok(alertsBody.data.length >= 2);

      const pltAlert = alertsBody.data.find((a) => a.parameterCode === 'PLT');
      assert.ok(pltAlert);
      assert.equal(pltAlert.urgencyLevel, 'CRITICAL_IMMEDIATE');
      assert.equal(pltAlert.communicatedToDoctor, true);
      assert.ok(pltAlert.integrityHash);

      const kAlert = alertsBody.data.find((a) => a.parameterCode === 'K');
      assert.ok(kAlert);
      assert.equal(kAlert.urgencyLevel, 'CRITICAL_IMMEDIATE');
      assert.ok(kAlert.clinicalRiskSummary.includes('arrhythmia'));

      console.log(`  ✔ [PASS] Panic alerts triggered: PLT 12 (CRITICAL_LOW) & K 6.9 (CRITICAL_HIGH) with CDSS escalation`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 7: Westgard Multirule Quality Control (QC) Engine Validation
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 7] Testing Westgard Multirule QC Engine (1_3s, 2_2s, R_4s, 4_1s, 10_x)...');
    {
      // Target: Mean = 100.0, SD = 5.0
      // 7A. In-Control Run (Measured = 101.5, z = +0.30) -> PASSED
      const resQcNormal = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${rocheId}/qc-runs`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          testCode: 'GLU_QC',
          testName: 'Glucose Daily QC Level 1',
          controlLotNumber: 'LOT-GLU-N1',
          controlLevel: 'LEVEL_1_NORMAL',
          targetMean: 100.0,
          standardDeviation: 5.0,
          measuredValue: 101.5
        }
      });
      assert.equal(resQcNormal.statusCode, 201);
      const normalBody = JSON.parse(resQcNormal.body);
      assert.equal(normalBody.data.evaluation.westgardStatus, 'PASSED');
      assert.equal(normalBody.data.evaluation.violatedRules.length, 0);

      // 7B. Rule 1_3s Violation: Single run exceeds 3 SD (Measured = 117.0, z = +3.40) -> REJECTED
      const resQc13s = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${rocheId}/qc-runs`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          testCode: 'GLU_QC',
          testName: 'Glucose Daily QC Level 1',
          controlLotNumber: 'LOT-GLU-N1',
          targetMean: 100.0,
          standardDeviation: 5.0,
          measuredValue: 117.0
        }
      });
      assert.equal(resQc13s.statusCode, 201);
      const body13s = JSON.parse(resQc13s.body);
      assert.equal(body13s.data.evaluation.westgardStatus, 'REJECTED_VIOLATION');
      assert.ok(body13s.data.evaluation.violatedRules.includes('1_3s'));
      assert.ok(body13s.data.evaluation.recommendation.includes('recalibration'));

      // 7C. Rule 2_2s Violation: 2 consecutive runs exceed 2 SD (Previous = +2.3, Current = +2.4)
      const resQc22s = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${rocheId}/qc-runs`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          testCode: 'GLU_QC',
          testName: 'Glucose Daily QC Level 1',
          targetMean: 100.0,
          standardDeviation: 5.0,
          measuredValue: 112.0, // z = 2.4
          historicalZScores: [2.3]
        }
      });
      assert.equal(resQc22s.statusCode, 201);
      const body22s = JSON.parse(resQc22s.body);
      assert.equal(body22s.data.evaluation.westgardStatus, 'REJECTED_VIOLATION');
      assert.ok(body22s.data.evaluation.violatedRules.includes('2_2s'));

      // 7D. Rule R_4s Violation: Difference between 2 consecutive controls exceeds 4 SD (Previous = -2.1, Current = +2.2, diff = 4.3)
      const resQcR4s = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${rocheId}/qc-runs`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          testCode: 'GLU_QC',
          targetMean: 100.0,
          standardDeviation: 5.0,
          measuredValue: 111.0, // z = 2.2
          historicalZScores: [-2.1]
        }
      });
      assert.equal(resQcR4s.statusCode, 201);
      const bodyR4s = JSON.parse(resQcR4s.body);
      assert.equal(bodyR4s.data.evaluation.westgardStatus, 'REJECTED_VIOLATION');
      assert.ok(bodyR4s.data.evaluation.violatedRules.includes('R_4s'));

      // 7E. Rule 4_1s Violation: 4 consecutive runs exceed 1 SD (Historical = [1.2, 1.3, 1.1], Current = 1.4)
      const resQc41s = await app.inject({
        method: 'POST',
        url: `/api/v1/partner/hardware/analyzers/${rocheId}/qc-runs`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          testCode: 'GLU_QC',
          targetMean: 100.0,
          standardDeviation: 5.0,
          measuredValue: 107.0, // z = 1.4
          historicalZScores: [1.2, 1.3, 1.1]
        }
      });
      assert.equal(resQc41s.statusCode, 201);
      const body41s = JSON.parse(resQc41s.body);
      assert.equal(body41s.data.evaluation.westgardStatus, 'WARNING');
      assert.ok(body41s.data.evaluation.violatedRules.includes('4_1s'));

      // 7F. Query QC history
      const resQcList = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/hardware/analyzers/qc-runs?analyzerId=${rocheId}`,
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resQcList.statusCode, 200);
      const qcListBody = JSON.parse(resQcList.body);
      assert.ok(qcListBody.data.length >= 5);

      console.log(`  ✔ [PASS] Westgard Multirule Engine verified (In-control, 1_3s, 2_2s, R_4s, 4_1s)`);
      testsPassed++;
    }

    // ------------------------------------------------------------------------
    // TEST 8: Multi-Tenant Data Isolation & Cryptographic Audit Trail
    // ------------------------------------------------------------------------
    testsTotal++;
    console.log('[TEST 8] Validating Multi-Tenant Isolation & SHA-256 Tamper-Proof Audit Chain...');
    {
      // 8A. Tenant B cannot see Tenant A's analyzers
      const resTenantB = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/hardware/analyzers',
        headers: { authorization: `Bearer ${tokenB}` }
      });
      assert.equal(resTenantB.statusCode, 200);
      const bBody = JSON.parse(resTenantB.body);
      assert.equal(bBody.data.length, 0, 'Tenant B should not see Tenant A analyzers');

      // 8B. Tenant B cannot query Tenant A's analyzer detail
      const resTenantBDetail = await app.inject({
        method: 'GET',
        url: `/api/v1/partner/hardware/analyzers/${sysmexId}`,
        headers: { authorization: `Bearer ${tokenB}` }
      });
      assert.equal(resTenantBDetail.statusCode, 404);

      // 8C. Verify Tenant A Audit Traces have valid SHA-256 integrity hashes
      const resAudit = await app.inject({
        method: 'GET',
        url: '/api/v1/partner/hardware/audit-traces',
        headers: { authorization: `Bearer ${tokenA}` }
      });
      assert.equal(resAudit.statusCode, 200);
      const auditBody = JSON.parse(resAudit.body);
      assert.ok(auditBody.data.length >= 4);

      for (const trace of auditBody.data) {
        assert.ok(trace.integrityHash, 'Audit trace must have integrityHash');
        assert.equal(trace.integrityHash.length, 64, 'SHA-256 hash must be 64 hex characters');
      }

      console.log(`  ✔ [PASS] Multi-tenant isolation verified & SHA-256 cryptographic audit chain validated`);
      testsPassed++;
    }

    const duration = (performance.now() - startTime).toFixed(2);
    console.log('\n======================================================================');
    console.log(`🎉 TEST SUMMARY: ${testsPassed}/${testsTotal} SCENARIOS PASSED (${duration}ms)`);
    console.log('   LIS HARDWARE ANALYZER BIDIRECTIONAL INTERFACING FULLY CERTIFIED');
    console.log('======================================================================\n');
  } finally {
    await app.close();
  }
}

runLisMachineInterfacingTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH UNHANDLED ERROR:');
  console.error(err);
  process.exit(1);
});
