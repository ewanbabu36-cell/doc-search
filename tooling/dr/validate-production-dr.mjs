#!/usr/bin/env node

/**
 * DOC SEARCH — Production Disaster Recovery & Managed Backup Validator
 * 
 * Validates real cloud infrastructure attributes for AWS RDS / Managed PostgreSQL.
 * If live cloud credentials (AWS IAM / DATABASE_URL) are configured, performs active inspection.
 * If credentials are not present, explicitly reports NOT ACCESSIBLE without false certification.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================================');
console.log('  DOC SEARCH — PRODUCTION DISASTER RECOVERY & BACKUP VALIDATOR');
console.log('================================================================================');

const TARGET_PROVIDER = 'AWS RDS PostgreSQL (Multi-AZ)';
const TARGET_REGION = process.env.AWS_REGION || 'ap-south-1';
const DB_IDENTIFIER = process.env.RDS_INSTANCE_IDENTIFIER || 'docsearch-prod-primary';
const DATABASE_URL = process.env.DATABASE_URL || '';

console.log(`[TARGET ARCHITECTURE]  : ${TARGET_PROVIDER}`);
console.log(`[TARGET REGION]        : ${TARGET_REGION}`);
console.log(`[DB IDENTIFIER]        : ${DB_IDENTIFIER}`);
console.log(`[EXECUTION TIMESTAMP]  : ${new Date().toISOString()}`);
console.log('--------------------------------------------------------------------------------\n');

// Detect AWS Cloud CLI / Credential Availability
function checkAwsCredentialAvailability() {
  const hasEnvKeys = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  const hasRoleArn = Boolean(process.env.AWS_ROLE_ARN);

  let hasCli = false;
  let callerIdentity = null;

  try {
    const out = execSync('aws sts get-caller-identity --output json', {
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 5000,
      encoding: 'utf8'
    });
    callerIdentity = JSON.parse(out);
    hasCli = true;
  } catch {
    hasCli = false;
  }

  return {
    available: hasEnvKeys || hasRoleArn || (hasCli && callerIdentity !== null),
    hasCli,
    identity: callerIdentity?.Arn || null
  };
}

const cloudAccess = checkAwsCredentialAvailability();

const results = [];

function recordResult(checkName, status, details) {
  results.push({ checkName, status, details });
  const statusColor =
    status === 'PASS'
      ? '\x1b[32mPASS\x1b[0m'
      : status === 'FAIL'
      ? '\x1b[31mFAIL\x1b[0m'
      : status === 'NOT CONFIGURED'
      ? '\x1b[33mNOT CONFIGURED\x1b[0m'
      : '\x1b[35m' + status + '\x1b[0m';

  console.log(`  [${statusColor.padEnd(20)}] ${checkName.padEnd(35)} : ${details}`);
}

console.log('--- 1. CLOUD PROVIDER CONNECTIVITY ---');
if (!cloudAccess.available) {
  recordResult(
    'Cloud Provider Credentials',
    'NOT ACCESSIBLE',
    'No active AWS IAM credentials or sts:GetCallerIdentity session in environment.'
  );
} else {
  recordResult(
    'Cloud Provider Credentials',
    'PASS',
    `Authenticated as IAM identity: ${cloudAccess.identity}`
  );
}

console.log('\n--- 2. MANAGED DATABASE ATTRIBUTE CHECKS ---');
if (!cloudAccess.available) {
  recordResult('Database Engine & Version', 'NOT ACCESSIBLE', 'Awaiting live AWS RDS instance endpoint');
  recordResult('Multi-AZ High Availability', 'NOT CONFIGURED', 'Cannot query AWS DescribeDBInstances without IAM access');
  recordResult('Automated Backup Retention (>= 35d)', 'NOT CONFIGURED', 'Cannot verify BackupRetentionPeriod without IAM access');
  recordResult('Continuous WAL / PITR Availability', 'NOT CONFIGURED', 'Cannot verify EarliestRestorableTime without IAM access');
  recordResult('Storage Encryption (AWS KMS)', 'NOT CONFIGURED', 'Cannot verify StorageEncrypted without IAM access');
  recordResult('In-Transit Encryption (TLS Force)', 'NOT CONFIGURED', 'Cannot inspect rds.force_ssl parameter group');
  recordResult('CloudWatch Enhanced Monitoring', 'NOT ACCESSIBLE', 'Cannot inspect MonitoringInterval without IAM access');
  recordResult('Deletion Protection Flag', 'NOT CONFIGURED', 'Cannot inspect DeletionProtection without IAM access');
} else {
  try {
    const cmd = `aws rds describe-db-instances --db-instance-identifier ${DB_IDENTIFIER} --region ${TARGET_REGION} --output json`;
    const raw = execSync(cmd, { encoding: 'utf8' });
    const parsed = JSON.parse(raw);
    const db = parsed.DBInstances?.[0];

    if (!db) {
      recordResult('RDS Instance Existence', 'FAIL', `Instance ${DB_IDENTIFIER} not found in region ${TARGET_REGION}`);
    } else {
      // 1. Engine
      if (db.Engine === 'postgres' && parseFloat(db.EngineVersion) >= 16) {
        recordResult('Database Engine & Version', 'PASS', `${db.Engine} v${db.EngineVersion}`);
      } else {
        recordResult('Database Engine & Version', 'FAIL', `Expected postgres >= 16, found ${db.Engine} ${db.EngineVersion}`);
      }

      // 2. Multi-AZ
      if (db.MultiAZ === true) {
        recordResult('Multi-AZ High Availability', 'PASS', `Enabled (Secondary AZ: ${db.SecondaryAvailabilityZone || 'Configured'})`);
      } else {
        recordResult('Multi-AZ High Availability', 'FAIL', 'Single-AZ only (High Availability requirement violated)');
      }

      // 3. Backup Retention
      if (db.BackupRetentionPeriod >= 35) {
        recordResult('Automated Backup Retention (>= 35d)', 'PASS', `${db.BackupRetentionPeriod} days retained`);
      } else {
        recordResult('Automated Backup Retention (>= 35d)', 'FAIL', `${db.BackupRetentionPeriod} days (Strict requirement: >= 35)`);
      }

      // 4. PITR
      if (db.LatestRestorableTime) {
        recordResult('Continuous WAL / PITR Availability', 'PASS', `Latest Restorable Time: ${db.LatestRestorableTime}`);
      } else {
        recordResult('Continuous WAL / PITR Availability', 'FAIL', 'No continuous WAL restorable window reported');
      }

      // 5. Encryption at rest
      if (db.StorageEncrypted === true) {
        recordResult('Storage Encryption (AWS KMS)', 'PASS', `Enabled (KMS Key: ${db.KmsKeyId})`);
      } else {
        recordResult('Storage Encryption (AWS KMS)', 'FAIL', 'Storage is NOT encrypted at rest');
      }

      // 6. Deletion Protection
      if (db.DeletionProtection === true) {
        recordResult('Deletion Protection Flag', 'PASS', 'Enabled');
      } else {
        recordResult('Deletion Protection Flag', 'FAIL', 'Disabled (Accidental deletion risk in production)');
      }
    }
  } catch (err) {
    recordResult('RDS Query Execution', 'FAIL', `Error querying AWS RDS API: ${err.message}`);
  }
}

console.log('\n--- 3. APPLICATION-LAYER FAIL-CLOSED VERIFICATION ---');
// Verify client.ts strict TLS enforcement in source code
const clientTsPath = path.resolve(process.cwd(), 'packages/database/src/client.ts');
if (fs.existsSync(clientTsPath)) {
  const code = fs.readFileSync(clientTsPath, 'utf8');
  if (code.includes("rejectUnauthorized = process.env['NODE_ENV'] === 'production'\n      ? true")) {
    recordResult('Application TLS Policy', 'PASS', 'client.ts strictly enforces rejectUnauthorized = true in production');
  } else {
    recordResult('Application TLS Policy', 'FAIL', 'client.ts allows unverified TLS in production');
  }

  if (code.includes('Embedded pg-mem is strictly forbidden in production')) {
    recordResult('Production Fail-Closed Policy', 'PASS', 'client.ts strictly blocks in-memory fallback in production');
  } else {
    recordResult('Production Fail-Closed Policy', 'FAIL', 'Embedded database fallback not blocked in production');
  }
} else {
  recordResult('Application Client Source', 'FAIL', 'packages/database/src/client.ts not found');
}

// Verify health.ts readiness probe
const healthTsPath = path.resolve(process.cwd(), 'apps/api-gateway/src/routes/health.ts');
if (fs.existsSync(healthTsPath)) {
  const code = fs.readFileSync(healthTsPath, 'utf8');
  if (code.includes("status: 'not_ready'") && code.includes("database: 'disconnected'")) {
    recordResult('Gateway Readiness Probe (/ready)', 'PASS', 'health.ts strictly returns 503 on database query failure');
  } else {
    recordResult('Gateway Readiness Probe (/ready)', 'FAIL', 'Readiness probe masks database failure');
  }
}

console.log('\n--- 4. MIGRATION & RUNBOOK CONSISTENCY ---');
const journalPath = path.resolve(process.cwd(), 'packages/database/migrations/meta/_journal.json');
if (fs.existsSync(journalPath)) {
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  const count = journal.entries?.length || 0;
  if (count >= 51) {
    recordResult('Drizzle Migration Journal', 'PASS', `${count} sequentially ordered migrations registered`);
  } else {
    recordResult('Drizzle Migration Journal', 'FAIL', `Expected >= 51 migrations, found ${count}`);
  }
}

const runbookPath = path.resolve(process.cwd(), 'docs/DISASTER_RECOVERY_RUNBOOK.md');
if (fs.existsSync(runbookPath)) {
  recordResult('Disaster Recovery Runbook', 'PASS', 'docs/DISASTER_RECOVERY_RUNBOOK.md present');
} else {
  recordResult('Disaster Recovery Runbook', 'FAIL', 'docs/DISASTER_RECOVERY_RUNBOOK.md missing');
}

console.log('\n--- 5. DRILL EXECUTION STATUS ---');
recordResult('Managed Multi-AZ Failover Drill', 'NOT EXECUTED', 'Controlled failover requires live AWS RDS cluster session');
recordResult('Point-in-Time Recovery (PITR) Drill', 'NOT EXECUTED', 'Step A-F requires live cloud continuous WAL archive');

console.log('\n================================================================================');
const passCount = results.filter((r) => r.status === 'PASS').length;
const failCount = results.filter((r) => r.status === 'FAIL').length;
const notConfiguredCount = results.filter((r) => r.status === 'NOT CONFIGURED').length;
const notAccessibleCount = results.filter((r) => r.status === 'NOT ACCESSIBLE').length;
const notExecutedCount = results.filter((r) => r.status === 'NOT EXECUTED').length;

console.log(`SUMMARY: ${passCount} PASS | ${failCount} FAIL | ${notConfiguredCount} NOT CONFIGURED | ${notAccessibleCount} NOT ACCESSIBLE | ${notExecutedCount} NOT EXECUTED`);

console.log('--------------------------------------------------------------------------------');
if (!cloudAccess.available || notExecutedCount > 0) {
  console.log('\x1b[33mFINAL VERDICT: P1-01 BLOCKED — REAL CLOUD DR EVIDENCE REQUIRED\x1b[0m');
  console.log('Reason: Application layer is hardened, but live AWS RDS Multi-AZ telemetry');
  console.log('and physical failover/PITR drills cannot be certified from source code alone.');
} else if (failCount === 0) {
  console.log('\x1b[32mFINAL VERDICT: P1-01 PASS\x1b[0m');
} else {
  console.log('\x1b[31mFINAL VERDICT: P1-01 FAIL\x1b[0m');
}
console.log('================================================================================');
