// scripts/test-ewan-super-brain-suite.mjs
import crypto from 'node:crypto';
import pg from 'pg';

const API_BASE = process.env.API_GATEWAY_URL || 'http://127.0.0.1:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-docsearch-jwt-key-2026-production-grade';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/docsearch';
const ACTIVE_TENANT_ID = '6855be07-5298-4148-a571-c51ac49ac7f3';

const { Client } = pg;

function generateAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000001',
    email: 'admin@docsearch.internal',
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
    permissions: ['*'],
    isSuperAdmin: true,
    tenantId: ACTIVE_TENANT_ID,
    activeTenantId: ACTIVE_TENANT_ID,
    iat: now,
    exp: now + 3600,
    iss: 'docsearch-api',
    aud: 'docsearch-platform'
  })).toString('base64url');

  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

const ADMIN_TOKEN = generateAdminToken();

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName} ${details ? `[${details}]` : ''}`);
  }
}

async function runEwanSuperBrainSuite() {
  console.log('\n======================================================================');
  console.log('🧠 EWAN 2.0 OMNISCIENT HEALTHCARE MASTER BRAIN ZERO-MOCK TEST SUITE');
  console.log('Target: Live PostgreSQL 18.4 (Port 5432) & Fastify Gateway (Port 4000)');
  console.log('======================================================================\n');

  // 1. Direct PostgreSQL 18.4 Connection Test
  console.log('[Phase 1] Verifying Native PostgreSQL 18.4 Persistence...');
  const dbClient = new Client({ connectionString: DB_URL });
  await dbClient.connect();
  const dbVerRes = await dbClient.query('SELECT version();');
  assert(dbVerRes.rows.length > 0, 'PostgreSQL 18.4 TCP Connection', dbVerRes.rows[0].version.slice(0, 30));

  // Verify EWAN Tables Existence
  const tablesRes = await dbClient.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name IN (
      'ewan_leakage_audit_logs',
      'cashier_blind_drops',
      'doctor_payout_clawbacks',
      'ewan_escalation_audits',
      'ewan_executive_briefings',
      'ewan_nabh_statutory_binders'
    );
  `);
  const foundTables = tablesRes.rows.map(r => r.table_name);
  assert(foundTables.length === 6, 'All 6 EWAN 2.0 PostgreSQL tables registered', `Found: ${foundTables.join(', ')}`);

  // =========================================================================
  // ENCLAVE 1: 15-Domain System Knowledge Library & Semantic Search
  // =========================================================================
  console.log('\n[Phase 2] Testing Enclave 1: 15-Domain Knowledge Matrix & Semantic Finder...');
  
  // 1.1 All Domains Search
  const allRes = await fetch(`${API_BASE}/api/v1/partner/ewan/knowledge/search`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const allData = await allRes.json();
  assert(allRes.status === 200, 'GET /api/v1/partner/ewan/knowledge/search status 200');
  assert(allData.totalDomainsAvailable === 15, '15 Full Hospital Domains Available in Master Brain', `Available: ${allData.totalDomainsAvailable}`);

  // 1.2 Keyword: Sponge Count (OT Safety Sentinel)
  const otRes = await fetch(`${API_BASE}/api/v1/partner/ewan/knowledge/search?query=sponge%20count`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const otData = await otRes.json();
  assert(otData.data.length > 0, 'Semantic Search: "sponge count" returns matches');
  assert(otData.data[0].id === 'ot-safety-sentinel', 'Top result is OT Safety Sentinel', otData.data[0].title);
  assert(!!otData.data[0].hinglishGuide, 'Bilingual Hinglish SOP present in OT guide');

  // 1.3 Keyword: Nurse Call Bell (Inpatient Concierge)
  const bellRes = await fetch(`${API_BASE}/api/v1/partner/ewan/knowledge/search?query=call%20bell%20sla`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const bellData = await bellRes.json();
  assert(bellData.data.length > 0, 'Semantic Search: "call bell sla" returns matches');
  assert(bellData.data[0].id === 'bedside-concierge-callbell', 'Top result is Bedside Concierge & Call Bell', bellData.data[0].title);

  // 1.4 Keyword: PMJAY Golden Card
  const pmjayRes = await fetch(`${API_BASE}/api/v1/partner/ewan/knowledge/search?query=golden%20card`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const pmjayData = await pmjayRes.json();
  assert(pmjayData.data.length > 0, 'Semantic Search: "golden card" returns matches');
  assert(pmjayData.data[0].id === 'pmjay-government-scheme', 'Top result is PM-JAY HBP 2.2 Scheme', pmjayData.data[0].title);

  // 1.5 Keyword: FEFO Pharmacy & Schedule H1
  const fefoRes = await fetch(`${API_BASE}/api/v1/partner/ewan/knowledge/search?query=schedule%20h1%20narcotics`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const fefoData = await fefoRes.json();
  assert(fefoData.data.length > 0, 'Semantic Search: "schedule h1 narcotics" returns matches');
  assert(fefoData.data[0].id === 'smart-pharmacy-fefo-pos', 'Top result is Smart Pharmacy FEFO POS', fefoData.data[0].title);

  // =========================================================================
  // ENCLAVE 2: Autonomous Revenue Leakage Sentinel & Auto-Heal Engine
  // =========================================================================
  console.log('\n[Phase 3] Testing Enclave 2: Revenue Leakage Sentinel & 1-Click Auto-Heal...');
  
  // 2.1 Live Leakage Audit Scan
  const auditRes = await fetch(`${API_BASE}/api/v1/partner/ewan/leakage/live-audit`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const auditData = await auditRes.json();
  assert(auditRes.status === 200, 'GET /api/v1/partner/ewan/leakage/live-audit status 200');
  assert(auditData.data.totalLeakageAmount > 0, 'Detected active leakage amount in INR', `₹${auditData.data.totalLeakageAmount}`);
  assert(auditData.data.leakageItems.length > 0, 'Found itemized leakage findings', `Items: ${auditData.data.leakageItems.length}`);
  const auditLogId = auditData.data.auditLogId;

  // Verify Audit Log persisted in PostgreSQL
  const dbAuditCheck = await dbClient.query('SELECT * FROM ewan_leakage_audit_logs WHERE id = $1', [auditLogId]);
  assert(dbAuditCheck.rows.length === 1, 'Audit Log persisted directly to PostgreSQL ewan_leakage_audit_logs', `ID: ${auditLogId}`);

  // 2.2 Execute 1-Click Auto-Heal
  const healRes = await fetch(`${API_BASE}/api/v1/partner/ewan/leakage/auto-heal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      leakageId: auditLogId,
      autoPostUnbilled: true,
      issueDoctorClawbacks: true,
      createRtvClaims: true,
      resolveCashierVariances: true
    })
  });
  const healData = await healRes.json();
  assert(healRes.status === 200, 'POST /api/v1/partner/ewan/leakage/auto-heal status 200');
  assert(healData.data.autoHealedAmount > 0, 'Auto-Heal recovered and reconciled financial leakage', `₹${healData.data.autoHealedAmount}`);
  assert(healData.data.actionsCount >= 2, 'Executed atomic resolution actions across clinical tables', `Actions: ${healData.data.actionsCount}`);

  // Verify doctor clawback debit note updated in DB
  const dbClawbackCheck = await dbClient.query(`
    SELECT status, debit_note_reference FROM doctor_payout_clawbacks
    WHERE tenant_id = $1 AND status = 'DEBIT_NOTE_ISSUED' LIMIT 1
  `, [ACTIVE_TENANT_ID]);
  assert(dbClawbackCheck.rows.length > 0, 'Doctor clawback status updated to DEBIT_NOTE_ISSUED in DB', dbClawbackCheck.rows[0]?.debit_note_reference);

  // Verify cashier blind drop updated in DB
  const dbCashierCheck = await dbClient.query(`
    SELECT variance_status FROM cashier_blind_drops
    WHERE tenant_id = $1 AND variance_status = 'AUTO_HEALED_SUPERVISOR_OVERRIDE' LIMIT 1
  `, [ACTIVE_TENANT_ID]);
  assert(dbCashierCheck.rows.length > 0, 'Cashier blind drop marked AUTO_HEALED_SUPERVISOR_OVERRIDE in DB');

  // =========================================================================
  // ENCLAVE 3: System-Wide Pending Bottleneck Radar & SLA Escalation
  // =========================================================================
  console.log('\n[Phase 4] Testing Enclave 3: Bottleneck Radar & Emergency SLA Escalation...');
  
  // 3.1 Radar Scan
  const radarRes = await fetch(`${API_BASE}/api/v1/partner/ewan/bottlenecks/radar`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const radarData = await radarRes.json();
  assert(radarRes.status === 200, 'GET /api/v1/partner/ewan/bottlenecks/radar status 200');
  assert(radarData.data.length > 0, 'Detected active operational clinical bottlenecks', `Total: ${radarData.data.length}`);
  assert(radarData.summary.redCodeCount >= 1, 'Identified Red Code high urgency alerts', `Red Code: ${radarData.summary.redCodeCount}`);

  // 3.2 Dispatch Emergency Multi-Channel Escalation
  const sampleBottleneck = radarData.data[0];
  const escalateRes = await fetch(`${API_BASE}/api/v1/partner/ewan/bottlenecks/escalate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({
      bottleneckId: sampleBottleneck.id,
      bottleneckType: sampleBottleneck.bottleneckType,
      urgency: sampleBottleneck.urgency,
      patientUhid: sampleBottleneck.patientUhid,
      patientName: sampleBottleneck.patientName,
      department: sampleBottleneck.department,
      responsibleClinician: sampleBottleneck.responsibleClinician,
      elapsedMinutes: sampleBottleneck.elapsedMinutes
    })
  });
  const escalateData = await escalateRes.json();
  assert(escalateRes.status === 200, 'POST /api/v1/partner/ewan/bottlenecks/escalate status 200');
  assert(escalateData.data.whatsappStatus === 'DELIVERED', 'WhatsApp emergency alert payload delivered');
  assert(!!escalateData.data.soundboxAnnouncement, 'MQTT Soundbox voice payload synthesized', escalateData.data.soundboxAnnouncement);

  // Verify escalation audit in PostgreSQL
  const dbEscCheck = await dbClient.query('SELECT * FROM ewan_escalation_audits WHERE bottleneck_id = $1', [sampleBottleneck.id]);
  assert(dbEscCheck.rows.length > 0, 'Escalation audit log recorded in PostgreSQL ewan_escalation_audits');

  // =========================================================================
  // ENCLAVE 4: Executive Chief of Staff Daily Voice Briefing & NABH Binder
  // =========================================================================
  console.log('\n[Phase 5] Testing Enclave 4: Executive Chief of Staff & Statutory NABH Binder...');
  
  // 4.1 Generate Morning Executive Voice Briefing
  const briefRes = await fetch(`${API_BASE}/api/v1/partner/ewan/executive/briefing/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({ briefingType: 'MORNING_EXECUTIVE' })
  });
  const briefData = await briefRes.json();
  assert(briefRes.status === 200, 'POST /api/v1/partner/ewan/executive/briefing/generate status 200');
  assert(briefData.data.voiceScriptText.length > 50, 'Voice script synthesized with operational metrics');
  assert(briefData.data.clinicalMetrics.bedOccupancyPct > 0, 'Real-time bed occupancy calculated', `${briefData.data.clinicalMetrics.bedOccupancyPct}%`);
  assert(briefData.data.financialMetrics.grossBilledToday > 0, 'Financial gross collections calculated', `₹${briefData.data.financialMetrics.grossBilledToday}`);
  assert(!!briefData.data.summaryBilingual.hinglish, 'Bilingual Hinglish operational summary generated');

  // Verify briefing in PostgreSQL
  const dbBriefCheck = await dbClient.query('SELECT * FROM ewan_executive_briefings WHERE id = $1', [briefData.data.briefingId]);
  assert(dbBriefCheck.rows.length === 1, 'Executive briefing persisted to PostgreSQL ewan_executive_briefings');

  // 4.2 Compile Statutory NABH 5th Edition Compliance Binder
  const binderRes = await fetch(`${API_BASE}/api/v1/partner/ewan/audit/nabh-binder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify({ auditCycle: 'NABH-5TH-EDITION-Q4-2026' })
  });
  const binderData = await binderRes.json();
  assert(binderRes.status === 200, 'POST /api/v1/partner/ewan/audit/nabh-binder status 200');
  assert(binderData.data.complianceScorePct >= 98.0, 'NABH 5th Edition compliance score certified', `${binderData.data.complianceScorePct}%`);
  assert(binderData.data.chaptersEvaluated.length === 5, 'All 5 core NABH chapters evaluated (COP, PRE, MOM, HIC, CQI)');
  assert(binderData.data.certifiedHash.length === 64, 'Statutory SHA-256 seal generated', binderData.data.certifiedHash);

  // Verify binder in PostgreSQL
  const dbBinderCheck = await dbClient.query('SELECT * FROM ewan_nabh_statutory_binders WHERE id = $1', [binderData.data.binderId]);
  assert(dbBinderCheck.rows.length === 1, 'NABH Statutory Binder persisted to PostgreSQL ewan_nabh_statutory_binders');

  await dbClient.end();

  // Final Test Summary
  console.log('\n======================================================================');
  console.log(`🎯 EWAN 2.0 ZERO-MOCK VERIFICATION SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEwanSuperBrainSuite().catch((err) => {
  console.error('\n[FATAL] Test runner encountered uncaught error:', err);
  process.exit(1);
});
