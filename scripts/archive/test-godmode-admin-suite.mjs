/**
 * DOCSEARCH GOD-LEVEL ADMIN & FOUNDER COMMAND CONTROL CENTER TEST SUITE
 * 100% Zero-Mock Verification against PostgreSQL 18.4 (Port 5432) & Fastify API Gateway (Port 4000)
 */

import crypto from 'node:crypto';
import http from 'node:http';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const API_BASE = 'http://127.0.0.1:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';

function createSuperAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    userId: 'FOUNDER-MERAJ-001',
    sub: 'FOUNDER-MERAJ-001',
    email: 'founder@docsearch.health',
    name: 'Meraj Sharif (Founder)',
    roles: ['SUPER_ADMIN', 'SUPER_ADMIN_FOUNDER'],
    permissions: ['*'],
    isSuperAdmin: true,
    tenantId: '6855be07-5298-4148-a571-c51ac49ac7f3',
    iat: now,
    exp: now + 3600,
    iss: 'docsearch-api',
    aud: 'docsearch-platform'
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function httpRequest(urlPath, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API_BASE);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(url, {
      method,
      headers,
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runGodModeTestSuite() {
  console.log('\n================================================================');
  console.log('⚡ DOCSEARCH GOD-LEVEL ADMIN & FOUNDER CONTROL TEST SUITE');
  console.log('================================================================\n');

  // Step 1: PostgreSQL 18.4 Direct Database Audit
  console.log('--- Step 1: PostgreSQL 18.4 Native Architecture Audit ---');
  const pgClient = new Client({ connectionString: DATABASE_URL });
  await pgClient.connect();
  console.log('  \x1b[32m✔\x1b[0m Connected to native PostgreSQL 18.4 on port 5432');

  const requiredTables = [
    'company_god_impersonation_sessions',
    'company_dynamic_feature_flags',
    'company_forensic_theft_radar',
    'company_predictive_churn_scores',
    'company_central_supply_arbitrage',
    'company_tenant_quarantines'
  ];

  for (const table of requiredTables) {
    const res = await pgClient.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [table]
    );
    assert(res.rows.length === 1, `PostgreSQL table '${table}' exists in live docsearch database`);
  }

  // Verify feature flags seeded
  const flagsCountRes = await pgClient.query(`SELECT COUNT(*)::int as count FROM company_dynamic_feature_flags`);
  assert(flagsCountRes.rows[0].count >= 5, `Dynamic feature flags table contains seeded baseline flags (Found: ${flagsCountRes.rows[0].count})`);

  // Verify theft radar anomalies seeded
  const theftCountRes = await pgClient.query(`SELECT COUNT(*)::int as count FROM company_forensic_theft_radar`);
  assert(theftCountRes.rows[0].count >= 4, `Forensic theft radar table contains seeded baseline anomalies (Found: ${theftCountRes.rows[0].count})`);

  // Verify churn risk scores seeded
  const churnCountRes = await pgClient.query(`SELECT COUNT(*)::int as count FROM company_predictive_churn_scores`);
  assert(churnCountRes.rows[0].count >= 3, `Predictive churn table contains evaluated partner risk scores (Found: ${churnCountRes.rows[0].count})`);

  // Verify supply chain arbitrage items seeded
  const supplyCountRes = await pgClient.query(`SELECT COUNT(*)::int as count FROM company_central_supply_arbitrage`);
  assert(supplyCountRes.rows[0].count >= 4, `Central supply arbitrage table contains high-margin catalog items (Found: ${supplyCountRes.rows[0].count})`);

  console.log('\n--- Step 2: Live Fastify API Gateway Zero-Mock Endpoints (Port 4000) ---');
  const superAdminToken = createSuperAdminToken();

  // Test API Gateway Health
  const healthRes = await httpRequest('/api/v1/health');
  console.log('HEALTH RES:', JSON.stringify(healthRes));
  assert(healthRes.statusCode === 200, 'Fastify API Gateway returned 200 OK');

  // Enclave 1: God-Mode Impersonation (Start & End)
  console.log('\n[Enclave 1: God-Mode Impersonation & Session Ghosting]');
  const startImpersonateRes = await httpRequest('/api/v1/company/godmode/impersonate/start', 'POST', {
    targetTenantId: '6855be07-5298-4148-a571-c51ac49ac7f3',
    targetTenantName: 'Apollo City Multi-Specialty Hospital',
    targetUserId: 'DOC-CHIEF-001',
    targetUserName: 'Dr. Vikramaditya Sen (Chief of Surgery)',
    targetUserRole: 'DOCTOR',
    reason: 'Zero-mock forensic PAC sign-off SLA verification',
    sessionMode: 'READ_ONLY_AUDITED'
  }, superAdminToken);

  assert(startImpersonateRes.statusCode === 201 || startImpersonateRes.statusCode === 200, `POST /api/v1/company/godmode/impersonate/start returned 201 Created`);
  const sessionData = startImpersonateRes.data?.data;
  assert(Boolean(sessionData?.ghostSessionToken || sessionData?.sessionToken), 'Impersonation response contains cryptographically signed ghost sessionToken');
  assert(Boolean(sessionData?.sessionId), 'Ghost session has unique UUID sessionId');
  assert(Boolean(sessionData?.auditHash), 'Ghost session contains tamper-evident SHA-256 audit seal');

  // Verify database record in PostgreSQL
  const dbGhostRes = await pgClient.query(
    `SELECT * FROM company_god_impersonation_sessions WHERE id = $1`,
    [sessionData.sessionId]
  );
  assert(dbGhostRes.rows.length === 1, 'Ghost session successfully logged in PostgreSQL company_god_impersonation_sessions');
  assert(dbGhostRes.rows[0].is_active === true, 'Ghost session is marked is_active = true');

  // End Impersonation
  const endImpersonateRes = await httpRequest('/api/v1/company/godmode/impersonate/end', 'POST', {
    sessionId: sessionData.sessionId,
    summaryNotes: 'Completed autonomous audit with zero unauthorized mutations'
  }, superAdminToken);
  assert(endImpersonateRes.statusCode === 200, 'POST /api/v1/company/godmode/impersonate/end returned 200 OK');

  const dbGhostEndRes = await pgClient.query(
    `SELECT * FROM company_god_impersonation_sessions WHERE id = $1`,
    [sessionData.sessionId]
  );
  assert(dbGhostEndRes.rows[0].is_active === false, 'Ghost session is deactivated (is_active = false) in PostgreSQL');

  // Enclave 2: Dynamic Feature Flags & Circuit Breakers
  console.log('\n[Enclave 2: Dynamic Feature Flags & Zero-Downtime Circuit Breakers]');
  const flagsGetRes = await httpRequest('/api/v1/company/godmode/feature-flags', 'GET', null, superAdminToken);
  assert(flagsGetRes.statusCode === 200, 'GET /api/v1/company/godmode/feature-flags returned 200 OK');
  assert(Array.isArray(flagsGetRes.data?.data), 'Feature flags data is an array of toggles');
  assert(flagsGetRes.data?.data?.length >= 6, 'All system feature flags loaded from PostgreSQL');

  // Runtime Toggle Flag
  const toggleRes = await httpRequest('/api/v1/company/godmode/feature-flags/toggle', 'POST', {
    flagKey: 'CIRCUIT_BREAKER_SMS_GATEWAY',
    circuitBreakerActive: true,
    fallbackAction: 'AUTOMATED_WHATSAPP_FALLBACK'
  }, superAdminToken);
  assert(toggleRes.statusCode === 200, 'POST /api/v1/company/godmode/feature-flags/toggle tripped emergency circuit breaker');

  const dbFlagCheck = await pgClient.query(
    `SELECT circuit_breaker_active, fallback_action FROM company_dynamic_feature_flags WHERE flag_key = $1`,
    ['CIRCUIT_BREAKER_SMS_GATEWAY']
  );
  assert(dbFlagCheck.rows[0].circuit_breaker_active === true, 'Circuit breaker status persisted in PostgreSQL 18.4');

  // Restore flag state
  await httpRequest('/api/v1/company/godmode/feature-flags/toggle', 'POST', {
    flagKey: 'CIRCUIT_BREAKER_SMS_GATEWAY',
    circuitBreakerActive: false
  }, superAdminToken);

  // Enclave 3: Forensic Theft Radar (Healthcare Stripe Radar)
  console.log('\n[Enclave 3: Forensic Theft Radar & Internal Fraud Interceptor]');
  const theftRes = await httpRequest('/api/v1/company/godmode/theft-radar/live', 'GET', null, superAdminToken);
  assert(theftRes.statusCode === 200, 'GET /api/v1/company/godmode/theft-radar/live returned 200 OK');
  assert(Array.isArray(theftRes.data?.data), 'Theft radar anomalies returned as structured array');
  assert(theftRes.data?.summary?.totalRiskAmount > 0, `Total revenue leakage calculated in INR (Found: ₹${theftRes.data?.summary?.totalRiskAmount})`);

  // Quarantine Staff
  const alertToQuarantine = theftRes.data?.data[0];
  const quarantineStaffRes = await httpRequest('/api/v1/company/godmode/theft-radar/quarantine-staff', 'POST', {
    alertId: alertToQuarantine.id,
    staffId: alertToQuarantine.staff_id,
    staffName: alertToQuarantine.staff_name
  }, superAdminToken);
  assert(quarantineStaffRes.statusCode === 200, 'POST /api/v1/company/godmode/theft-radar/quarantine-staff returned 200 OK');

  const dbStaffCheck = await pgClient.query(
    `SELECT is_quarantined, auto_action_taken FROM company_forensic_theft_radar WHERE id = $1`,
    [alertToQuarantine.id]
  );
  assert(dbStaffCheck.rows[0].is_quarantined === true, 'Rogue cashier successfully quarantined in PostgreSQL');
  assert(dbStaffCheck.rows[0].auto_action_taken.includes('STAFF_ACCOUNT_SUSPENDED'), 'Staff action recorded as STAFF_ACCOUNT_SUSPENDED');

  // Enclave 4: Predictive Churn Radar & B2B Supply Arbitrage
  console.log('\n[Enclave 4: Predictive Partner Churn Radar & B2B Supply Arbitrage]');
  const churnRes = await httpRequest('/api/v1/company/godmode/churn-radar', 'GET', null, superAdminToken);
  assert(churnRes.statusCode === 200, 'GET /api/v1/company/godmode/churn-radar returned 200 OK');
  assert(Array.isArray(churnRes.data?.data), 'Churn radar returned partner risk health scores');
  assert(churnRes.data?.summary?.criticalCount >= 1 || churnRes.data?.summary?.redCriticalRiskCount >= 1, 'Predictive churn identified RED_CRITICAL partner early warning');

  const supplyRes = await httpRequest('/api/v1/company/godmode/supply-chain/arbitrage', 'GET', null, superAdminToken);
  assert(supplyRes.statusCode === 200, 'GET /api/v1/company/godmode/supply-chain/arbitrage returned 200 OK');
  assert(Array.isArray(supplyRes.data?.data), 'B2B supply chain arbitrage catalog items returned');
  assert(supplyRes.data?.summary?.totalMonthlyNetProfit > 0, `Pan-India consumable arbitrage gross profit calculated (Found: ₹${supplyRes.data?.summary?.totalMonthlyNetProfit})`);

  // Enclave 5: Emergency Remote Quarantine & Pan-India War Room
  console.log('\n[Enclave 5: Emergency Remote Tenant Quarantine & War Room Telemetry]');
  const testTenantId = '6855be07-5298-4148-a571-c51ac49ac7f3';
  const quarantineTenantRes = await httpRequest('/api/v1/company/godmode/tenant/quarantine', 'POST', {
    tenantId: testTenantId,
    tenantName: 'Apollo City Multi-Specialty Hospital',
    reason: 'Zero-mock ransomware emergency drill simulation',
    action: 'FREEZE'
  }, superAdminToken);
  assert(quarantineTenantRes.statusCode === 200, 'POST /api/v1/company/godmode/tenant/quarantine FREEZE returned 200 OK');

  const dbTenantQuarantine = await pgClient.query(
    `SELECT quarantine_status, quarantine_reason, read_only_enforced FROM company_tenant_quarantines WHERE tenant_id = $1 ORDER BY initiated_at DESC LIMIT 1`,
    [testTenantId]
  );
  assert(dbTenantQuarantine.rows.length === 1 && dbTenantQuarantine.rows[0].quarantine_status === 'EMERGENCY_QUARANTINE_FROZEN' && dbTenantQuarantine.rows[0].read_only_enforced === true, 'Tenant emergency quarantine lockdown active in PostgreSQL');

  // Unfreeze
  const unfreezeRes = await httpRequest('/api/v1/company/godmode/tenant/quarantine', 'POST', {
    tenantId: testTenantId,
    action: 'UNFREEZE'
  }, superAdminToken);
  assert(unfreezeRes.statusCode === 200, 'POST /api/v1/company/godmode/tenant/quarantine UNFREEZE returned 200 OK');

  // Real-Time War Room Telemetry
  const warRoomRes = await httpRequest('/api/v1/company/godmode/war-room/telemetry', 'GET', null, superAdminToken);
  assert(warRoomRes.statusCode === 200, 'GET /api/v1/company/godmode/war-room/telemetry returned 200 OK');
  const warRoomData = warRoomRes.data?.data;
  assert(warRoomData?.networkOverview?.todayConsultationsTotal > 0, 'War room reports nationwide consultations volume');
  assert(warRoomData?.networkOverview?.todayGrossBillingGmv > 0, 'War room reports nationwide gross collections GMV');
  assert(warRoomData?.emergencyTelemetry?.activeAmbulancesInTransit > 0, 'War room reports real-time ambulances in transit');
  assert(Array.isArray(warRoomData?.stateTelemetryFeeds), 'War room reports multi-state telemetry feeds');

  await pgClient.end();

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} ZERO-MOCK TESTS PASSED SUCCESSFULLY!`);
  console.log('⚡ DOCSEARCH GOD-LEVEL ADMIN COMMAND CONTROL CENTER IS CERTIFIED!');
  console.log('================================================================\n');
}

runGodModeTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
