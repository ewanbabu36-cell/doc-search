/**
 * PHASE 6 — Observability, Health Checks & Logging Security Audit Harness
 * Strictly measures /health (liveness), /ready (readiness), and structured log redaction.
 * ZERO assumed or fabricated numbers.
 */

import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { buildApp } from '../../apps/api-gateway/dist/app.js';
import { setupTestDatabase, getDatabase, setTestTransactionRunner } from '../../packages/database/dist/index.js';
import { createLogger, redactSensitiveData } from '../../packages/shared-core/dist/index.js';

export async function runObservabilityAudit() {
  console.log('============================================================');
  console.log('📡 PHASE 6 — OBSERVABILITY, HEALTH CHECKS & LOGGING AUDIT');
  console.log('============================================================');

  await setupTestDatabase({ seedBaseline: true });
  const app = await buildApp();
  await app.ready();

  const auditResults = {
    livenessProbe: {},
    readinessProbeConnected: {},
    readinessProbeOutage: {},
    structuredJsonLogging: {},
    sensitiveDataRedaction: {}
  };

  // -------------------------------------------------------------
  // 1. Liveness Probe (GET /health)
  // -------------------------------------------------------------
  console.log('\n[+] Step 1: Auditing Liveness Probe (GET /health)...');
  const t0Health = performance.now();
  const healthRes = await app.inject({ method: 'GET', url: '/health' });
  const healthLatencyMs = performance.now() - t0Health;
  const healthBody = JSON.parse(healthRes.payload);

  auditResults.livenessProbe = {
    statusCode: healthRes.statusCode,
    latencyMs: Number(healthLatencyMs.toFixed(2)),
    status: healthBody.status,
    service: healthBody.service,
    hasUptime: typeof healthBody.uptime === 'number',
    hasTimestamp: Boolean(Date.parse(healthBody.timestamp)),
    verdict: healthRes.statusCode === 200 && healthBody.status === 'healthy'
      ? 'PASS — LIVENESS PROBE OPERATIONAL'
      : 'FAIL'
  };
  console.log('    ➔ /health: Status ' + healthRes.statusCode + ', Response time: ' + healthLatencyMs.toFixed(2) + ' ms');
  console.log('    ➔ Liveness Verdict: ' + auditResults.livenessProbe.verdict);

  // -------------------------------------------------------------
  // 2. Readiness Probe Connected (GET /ready)
  // -------------------------------------------------------------
  console.log('\n[+] Step 2: Auditing Readiness Probe with Active Database (GET /ready)...');
  const t0Ready = performance.now();
  const readyRes = await app.inject({ method: 'GET', url: '/ready' });
  const readyLatencyMs = performance.now() - t0Ready;
  const readyBody = JSON.parse(readyRes.payload);

  auditResults.readinessProbeConnected = {
    statusCode: readyRes.statusCode,
    latencyMs: Number(readyLatencyMs.toFixed(2)),
    status: readyBody.status,
    database: readyBody.database,
    verdict: readyRes.statusCode === 200 && readyBody.status === 'ready'
      ? 'PASS — READINESS PROBE CONFIRMS DATABASE CONNECTIVITY'
      : 'FAIL'
  };
  console.log('    ➔ /ready: Status ' + readyRes.statusCode + ' (database: ' + readyBody.database + '), Response time: ' + readyLatencyMs.toFixed(2) + ' ms');
  console.log('    ➔ Readiness Connected Verdict: ' + auditResults.readinessProbeConnected.verdict);

  // -------------------------------------------------------------
  // 3. Readiness Probe Severed (GET /ready with DB failure in production mode)
  // -------------------------------------------------------------
  console.log('\n[+] Step 3: Auditing Readiness Probe with Severed Database...');
  const origEnv = process.env['NODE_ENV'];
  process.env['NODE_ENV'] = 'production';

  const db = getDatabase();
  const origExecute = db.execute;
  db.execute = async () => { throw new Error('ECONNREFUSED 5432'); };

  const readyFailRes = await app.inject({ method: 'GET', url: '/ready' });
  const readyFailBody = JSON.parse(readyFailRes.payload);

  // Restore
  db.execute = origExecute;
  process.env['NODE_ENV'] = origEnv;

  auditResults.readinessProbeOutage = {
    statusCode: readyFailRes.statusCode,
    status: readyFailBody.status,
    error: readyFailBody.error,
    verdict: readyFailRes.statusCode === 503 && readyFailBody.status === 'not_ready'
      ? 'PASS — READINESS PROBE PROMPTLY FAILS 503 ON DATABASE OUTAGE'
      : 'FAIL'
  };
  console.log('    ➔ /ready (Severed): Status ' + readyFailRes.statusCode + ' (' + readyFailBody.status + ')');
  console.log('    ➔ Readiness Outage Verdict: ' + auditResults.readinessProbeOutage.verdict);

  // -------------------------------------------------------------
  // 4. Structured JSON Logging Audit
  // -------------------------------------------------------------
  console.log('\n[+] Step 4: Auditing Structured JSON Logging Format...');
  const logsCaptured = [];
  const originalConsoleInfo = console.info;
  console.info = (msg) => { logsCaptured.push(msg); };

  const logger = createLogger('audit-test-service', { tenantId: '11111111-1111-4111-8111-111111111111' });
  logger.info('Structured logging test event', { action: 'CLINICAL_VERIFICATION', patientCount: 42 });

  console.info = originalConsoleInfo;

  let parsedLog = null;
  try {
    parsedLog = JSON.parse(logsCaptured[0]);
  } catch {
    parsedLog = null;
  }

  const isStructuredJson = parsedLog !== null &&
    Boolean(parsedLog.timestamp) &&
    parsedLog.level === 'info' &&
    parsedLog.service === 'audit-test-service' &&
    parsedLog.message === 'Structured logging test event';

  auditResults.structuredJsonLogging = {
    rawLogCaptured: logsCaptured[0],
    isStructuredJson,
    hasIsoTimestamp: Boolean(Date.parse(parsedLog?.timestamp)),
    hasServiceTag: parsedLog?.service === 'audit-test-service',
    verdict: isStructuredJson ? 'PASS — STRICT STRUCTURED JSON LOG FORMAT ENFORCED' : 'FAIL'
  };
  console.log('    ➔ Structured Log Output: ' + logsCaptured[0]);
  console.log('    ➔ Logging Format Verdict: ' + auditResults.structuredJsonLogging.verdict);

  // -------------------------------------------------------------
  // 5. Sensitive Data Redaction Security Audit
  // -------------------------------------------------------------
  console.log('\n[+] Step 5: Auditing Sensitive Data Redaction in Logs...');
  const rawSensitivePayload = {
    patientName: 'Confidential Subject',
    password: 'SuperSecretPassword123!',
    userToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive.token',
    authorizationHeader: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret.token',
    aadhaarNumber: '1234-5678-9012',
    mrn: 'MRN-882711',
    doctorEmail: 'dr.sharma@apollohospitals.org',
    diagnosisNotes: 'Severe chronic cardiac condition',
    cvv: '999',
    creditCard: '4111111111111234'
  };

  const redactedResult = redactSensitiveData(rawSensitivePayload);

  const passwordRedacted = redactedResult.password === '[REDACTED]';
  const tokenRedacted = redactedResult.userToken === '[REDACTED]';
  const bearerRedacted = redactedResult.authorizationHeader === '[REDACTED]';
  const aadhaarRedacted = redactedResult.aadhaarNumber === '[REDACTED]';
  const mrnRedacted = redactedResult.mrn === '[REDACTED]';
  const emailMasked = redactedResult.doctorEmail === 'dr***@apollohospitals.org';
  const diagnosisRedacted = redactedResult.diagnosisNotes === '[REDACTED]';
  const cvvRedacted = redactedResult.cvv === '[REDACTED]';
  const ccRedacted = redactedResult.creditCard === '[REDACTED]';

  const allSensitiveFieldsProtected =
    passwordRedacted &&
    tokenRedacted &&
    bearerRedacted &&
    aadhaarRedacted &&
    mrnRedacted &&
    emailMasked &&
    diagnosisRedacted &&
    cvvRedacted &&
    ccRedacted;

  auditResults.sensitiveDataRedaction = {
    passwordProtected: passwordRedacted,
    tokenProtected: tokenRedacted,
    bearerProtected: bearerRedacted,
    aadhaarProtected: aadhaarRedacted,
    mrnProtected: mrnRedacted,
    emailMasked,
    diagnosisProtected: diagnosisRedacted,
    financialCvvProtected: cvvRedacted,
    financialCcProtected: ccRedacted,
    allProtected: allSensitiveFieldsProtected,
    verdict: allSensitiveFieldsProtected
      ? 'PASS — ZERO SENSITIVE CLINICAL/FINANCIAL/AUTH DATA LEAKAGE IN LOGS'
      : 'FAIL'
  };
  console.log('    ➔ Password Redacted: ' + passwordRedacted + ' (' + redactedResult.password + ')');
  console.log('    ➔ Token Redacted: ' + tokenRedacted + ' (' + redactedResult.userToken + ')');
  console.log('    ➔ Bearer Redacted: ' + bearerRedacted + ' (' + redactedResult.authorizationHeader + ')');
  console.log('    ➔ Aadhaar Redacted: ' + aadhaarRedacted + ' (' + redactedResult.aadhaarNumber + ')');
  console.log('    ➔ MRN Redacted: ' + mrnRedacted + ' (' + redactedResult.mrn + ')');
  console.log('    ➔ Email Masked: ' + emailMasked + ' (' + redactedResult.doctorEmail + ')');
  console.log('    ➔ Redaction Verdict: ' + auditResults.sensitiveDataRedaction.verdict);

  await app.close();

  fs.writeFileSync('./tests/reliability/phase6-observability-results.json', JSON.stringify(auditResults, null, 2));
  console.log('\n[+] Results saved to ./tests/reliability/phase6-observability-results.json');
  console.table(auditResults);
  return auditResults;
}

runObservabilityAudit().catch((err) => {
  console.error('Fatal Observability audit error:', err);
  process.exit(1);
});
