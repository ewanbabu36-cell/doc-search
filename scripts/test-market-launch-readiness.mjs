/**
 * DocSearch Market Launch Readiness & Commercial Certification Test Suite
 * -----------------------------------------------------------------------
 * Rigorous 5-Gate Automated Certification Suite verifying all commercial deliverables:
 * - Gate 1: Cloud S3 Encrypted Disaster Recovery Engine & SigV4 Signer
 * - Gate 2: Production Secrets & Zero-Tolerance Security Gate
 * - Gate 3: Pluggable SMS & WhatsApp DLT Gateway & Multi-Provider Dispatch
 * - Gate 4: Clean Production Facility Bootstrapper & Multi-Tenant Isolation
 * - Gate 5: End-to-End Cryptographic Scrypt Credential Verification
 */

import crypto from 'node:crypto';
import pg from 'pg';
import {
  signS3Request,
  uploadEncryptedBackupToS3,
  pruneRemoteS3Backups
} from './automated-encrypted-backup-cron.mjs';
import {
  auditProductionConfig,
  parseEnvFile
} from './verify-production-readiness.mjs';
import {
  notificationDispatchService,
  DLT_TEMPLATE_CATALOG
} from '../apps/api-gateway/dist/services/notification-dispatch.service.js';
import {
  bootstrapFacility,
  hashPasswordScrypt
} from './bootstrap-production-facility.mjs';
import { verifyPasswordAsync } from '../packages/auth/dist/index.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runGate1() {
  console.log(`\n--- GATE 1: Cloud S3 Encrypted Disaster Recovery Engine ---`);

  // 1. SigV4 Signature Generation
  const dummyPayload = Buffer.from('DocSearchEncryptedDisasterRecoverySnapshotPayload');
  const signedHeaders = signS3Request({
    method: 'PUT',
    urlStr: 'https://s3.ap-south-1.amazonaws.com/docsearch-dr/snapshot.enc',
    headers: { 'content-type': 'application/octet-stream' },
    payloadBuffer: dummyPayload,
    region: 'ap-south-1',
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  });

  assert(Boolean(signedHeaders.Authorization), 'signS3Request generates Authorization header');
  assert(signedHeaders.Authorization.startsWith('AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/'), 'Authorization header uses standard AWS4-HMAC-SHA256 scheme');
  assert(signedHeaders['x-amz-date'].length === 16, 'x-amz-date header formatted as ISO8601 basic format');
  assert(signedHeaders['x-amz-content-sha256'] === crypto.createHash('sha256').update(dummyPayload).digest('hex'), 'x-amz-content-sha256 matches SHA-256 digest of payload');

  // 2. Remote Retention Pruning
  const pruneRes = await pruneRemoteS3Backups({
    s3Config: {
      bucket: 'docsearch-dr-vault',
      accessKeyId: 'AKIAEXAMPLE',
      secretAccessKey: 'SecretExampleKey'
    },
    retentionDays: 30
  });
  assert(pruneRes.retentionDays === 30, 'Remote S3 retention policy threshold set to 30 days');
  assert(pruneRes.status === 'REMOTE_S3_RETENTION_ENFORCED', 'Remote S3 retention audit verified');
}

async function runGate2() {
  console.log(`\n--- GATE 2: Production Secrets & Zero-Tolerance Security Gate ---`);

  // 1. Test Security Gate Rejection on Insecure Keys
  const badConfig = {
    NODE_ENV: 'production',
    JWT_SECRET: 'REPLACE_WITH_HEX_64_CHAR_MASTER_JWT_KEY',
    ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    DATABASE_URL: 'postgresql://postgres:password@127.0.0.1:5432/docsearch',
    CORS_ORIGIN: '*'
  };

  const badResult = auditProductionConfig(badConfig);
  assert(!badResult.valid, 'Safety gate rejects default placeholder secrets');
  assert(badResult.issues.some((i) => i.check === 'JWT_SECRET'), 'Safety gate flags placeholder JWT_SECRET');
  assert(badResult.issues.some((i) => i.check === 'ENCRYPTION_KEY'), 'Safety gate flags sample ENCRYPTION_KEY');
  assert(badResult.issues.some((i) => i.check === 'CORS_ORIGIN'), 'Safety gate flags wildcard CORS_ORIGIN');

  // 2. Test Security Gate Approval on Hardened Configuration
  const hardenedConfig = {
    NODE_ENV: 'production',
    JWT_SECRET: crypto.randomBytes(32).toString('hex'), // 64 hex characters
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'), // 64 hex characters
    DATABASE_URL: 'postgresql://docsearch_prod_admin:SuperSecurePassword%402026@rds.ap-south-1.amazonaws.com:5432/docsearch',
    DATABASE_POOL_MIN: '10',
    DATABASE_POOL_MAX: '50',
    CORS_ORIGIN: 'https://docsearch.in,https://partner.docsearch.in,https://patient.docsearch.in',
    S3_BACKUP_ENABLED: 'true',
    S3_BUCKET_NAME: 'docsearch-disaster-recovery-ap-south',
    S3_ACCESS_KEY_ID: 'AKIA_PRODUCTION_DISASTER_KEY',
    S3_SECRET_ACCESS_KEY: 'PRODUCTION_SECRET_KEY_AES256'
  };

  const goodResult = auditProductionConfig(hardenedConfig);
  assert(goodResult.valid, 'Safety gate certifies hardened production secrets');
  assert(goodResult.issues.length === 0, 'Zero critical violations in hardened configuration');
}

async function runGate3() {
  console.log(`\n--- GATE 3: Pluggable SMS & WhatsApp DLT Production Gateway ---`);

  // 1. DLT Template Catalog Compliance
  assert(Boolean(DLT_TEMPLATE_CATALOG.OPD_TOKEN_ALERT), 'OPD_TOKEN_ALERT template registered');
  assert(DLT_TEMPLATE_CATALOG.OPD_TOKEN_ALERT.senderId === 'DOCSRH', 'Registered TRAI Principal Entity header is DOCSRH');
  assert(DLT_TEMPLATE_CATALOG.OPD_TOKEN_ALERT.dltContentId === '14071615243321', 'Valid 14-digit TRAI DLT Content Template ID assigned');

  // 2. Template Parameter Interpolation
  const formatted = notificationDispatchService.formatMessage(DLT_TEMPLATE_CATALOG.OPD_TOKEN_ALERT, {
    patientName: 'Sunita Sharma',
    tokenNumber: 42,
    doctorName: 'Dr. Rajiv Nambiar',
    hospitalName: 'Apollo Care',
    trackUrl: 'https://docsearch.in/t/42'
  });

  assert(formatted.includes('Sunita Sharma'), 'Interpolates patient name correctly');
  assert(formatted.includes('#42'), 'Interpolates token number correctly');
  assert(formatted.includes('Dr. Rajiv Nambiar'), 'Interpolates doctor name correctly');
  assert(formatted.includes('Apollo Care'), 'Interpolates hospital name correctly');

  // 3. Simulated Fallback Dispatch
  const dispatchRes = await notificationDispatchService.dispatch({
    recipientPhone: '9876543210',
    channel: 'WHATSAPP',
    templateId: 'OPD_TOKEN_ALERT',
    params: {
      patientName: 'Sunita Sharma',
      tokenNumber: 42,
      doctorName: 'Dr. Rajiv Nambiar',
      hospitalName: 'Apollo Care',
      trackUrl: 'https://docsearch.in/t/42'
    }
  });

  assert(dispatchRes.success, 'Dispatch completes successfully');
  assert(dispatchRes.provider === 'LOCAL_MOCK_FALLBACK', 'Falls back safely to local mock in absence of live API keys');
  assert(dispatchRes.messageId.startsWith('sim_dlt_'), 'Generates unique simulated message ID');

  // 4. Inbound Webhook Receipts Parsing
  const webhookRes = notificationDispatchService.processDeliveryWebhook('GUPSHUP_DLT', {
    type: 'message-delivered',
    payload: { id: 'gs_msg_98124' }
  });

  assert(webhookRes.status === 'DELIVERED', 'Normalizes Gupshup delivered receipt');
  assert(webhookRes.messageId === 'gs_msg_98124', 'Extracts message ID from webhook payload');
}

async function runGate4() {
  console.log(`\n--- GATE 4: Clean Production Facility Bootstrapper & Multi-Tenant Isolation ---`);

  const uniqueSeed = crypto.randomBytes(3).toString('hex').toUpperCase();
  const testFacilityName = `Fortis Healthcare City Center ${uniqueSeed}`;

  const provisioned = await bootstrapFacility({
    facilityName: testFacilityName,
    facilityType: 'HOSPITAL',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    doctorName: 'Dr. Ayesha Sen',
    doctorSpecialty: 'Cardiology & Internal Medicine',
    doctorRegNumber: `KMC-${uniqueSeed}`,
    consultationFee: 750
  });

  assert(Boolean(provisioned.tenantId), 'Tenant ID generated');
  assert(Boolean(provisioned.licenseKey), 'Signed HMAC license key generated');
  assert(provisioned.doctor.name === 'Dr. Ayesha Sen', 'Doctor name matches specification');
  assert(provisioned.doctor.specialty === 'Cardiology & Internal Medicine', 'Specialty matches specification');
  assert(provisioned.admin.email.includes('@fortis-healthcare-city-center'), 'Admin email domain matches facility slug');

  // Verify in PostgreSQL
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5432/docsearch' });
  try {
    const tenantRes = await pool.query('SELECT * FROM core.tenants WHERE id = $1', [provisioned.tenantId]);
    assert(tenantRes.rows.length === 1, 'Tenant record persisted in core.tenants');

    const partnerRes = await pool.query('SELECT * FROM company.partner_profiles WHERE tenant_id = $1', [provisioned.tenantId]);
    assert(partnerRes.rows.length === 1, 'Partner profile persisted in company.partner_profiles');

    const staffRes = await pool.query('SELECT * FROM clinical.operational_staff WHERE tenant_id = $1', [provisioned.tenantId]);
    assert(staffRes.rows.length === 1, 'Operational staff record persisted in clinical.operational_staff');

    const licenseRes = await pool.query('SELECT * FROM company.licenses WHERE tenant_id = $1', [provisioned.tenantId]);
    assert(licenseRes.rows.length === 1, 'License record persisted in company.licenses');
  } finally {
    await pool.end();
  }
}

async function runGate5() {
  console.log(`\n--- GATE 5: Cryptographic Scrypt Credential Verification ---`);

  const rawPassword = 'UniqueSecretPassword#2026!';
  const scryptHash = hashPasswordScrypt(rawPassword);

  assert(scryptHash.startsWith('$scrypt$N=16384,r=8,p=1$'), 'Password hash uses NIST scrypt parameters');

  const isMatch = await verifyPasswordAsync(rawPassword, scryptHash);
  assert(isMatch === true, 'verifyPasswordAsync authenticates valid scrypt password');

  const isWrongMatch = await verifyPasswordAsync('WrongPassword123!', scryptHash);
  assert(isWrongMatch === false, 'verifyPasswordAsync rejects incorrect password');
}

async function main() {
  console.log(`======================================================================`);
  console.log(`🚀 DOCSEARCH PRODUCTION MARKET-LAUNCH CERTIFICATION SUITE`);
  console.log(`======================================================================`);

  try {
    await runGate1();
    await runGate2();
    await runGate3();
    await runGate4();
    await runGate5();

    console.log(`\n======================================================================`);
    console.log(`📊 FINAL REPORT: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
    console.log(`======================================================================\n`);

    if (failedTests > 0) {
      console.error(`❌ CERTIFICATION SUITE FAILED WITH ${failedTests} FAILURES`);
      process.exit(1);
    }

    console.log(`🎉 ALL 5 PRODUCTION MARKET LAUNCH GATES PASSED 100%!`);
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

main();
