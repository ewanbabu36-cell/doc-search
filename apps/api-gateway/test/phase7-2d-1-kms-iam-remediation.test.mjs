/**
 * DOC SEARCH - PHASE 7.2D.1
 * Security Regression Test Suite: KMS IAM Authorization & External Secrets Remediation
 * 
 * Verifies remediation of Finding F-01 (External Secrets KMS Decrypt Permission Omission)
 * and evaluates all 9 required security invariants under least privilege.
 * 
 * Execution Mode: ISOLATED UNIT TESTS (AWS IAM & KMS Policy Evaluation Mocks).
 * Live cloud integration is explicitly marked BLOCKED/UNVERIFIED.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const infraDir = path.join(rootDir, 'infra');
const k8sDir = path.join(rootDir, 'k8s');

function matchArnPattern(pattern, actual) {
  if (pattern === '*' || pattern === actual) return true;
  const regexStr = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
  return new RegExp(regexStr).test(actual);
}

// -----------------------------------------------------------------------------
// AWS IAM & KMS Policy Evaluation Engine (Mock Simulator)
// -----------------------------------------------------------------------------
class MockAwsPolicyEngine {
  constructor() {
    this.keys = new Map();
    this.secrets = new Map();
    this.roles = new Map();
  }

  registerKmsKey(keyArn, { enabled = true, policy = null } = {}) {
    this.keys.set(keyArn, { keyArn, enabled, policy });
  }

  registerSecret(secretArn, { kmsKeyArn, value, tags = {} } = {}) {
    this.secrets.set(secretArn, { secretArn, kmsKeyArn, value, tags });
  }

  registerRole(roleArn, { trustPolicy, permissionPolicies = [] } = {}) {
    this.roles.set(roleArn, { roleArn, trustPolicy, permissionPolicies });
  }

  assumeRoleWithWebIdentity(roleArn, { oidcIssuer, tokenSub, tokenAud }) {
    const role = this.roles.get(roleArn);
    if (!role) {
      throw new Error(`NoSuchEntity: Role ${roleArn} does not exist`);
    }

    const { trustPolicy } = role;
    let allowed = false;

    for (const stmt of trustPolicy.Statement || []) {
      if (stmt.Effect === 'Allow' && stmt.Action === 'sts:AssumeRoleWithWebIdentity') {
        const cond = stmt.Condition?.StringEquals || {};
        const issuerSubKey = `${oidcIssuer.replace('https://', '')}:sub`;
        const issuerAudKey = `${oidcIssuer.replace('https://', '')}:aud`;

        const allowedSubs = Array.isArray(cond[issuerSubKey]) ? cond[issuerSubKey] : [cond[issuerSubKey]];
        const allowedAuds = Array.isArray(cond[issuerAudKey]) ? cond[issuerAudKey] : [cond[issuerAudKey]];

        if (allowedSubs.includes(tokenSub) && allowedAuds.includes(tokenAud)) {
          allowed = true;
          break;
        }
      }
    }

    if (!allowed) {
      const err = new Error(`AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity on ${roleArn}`);
      err.code = 'AccessDenied';
      throw err;
    }

    return { assumedRoleArn: roleArn, sessionName: tokenSub };
  }

  evaluatePermission(roleArn, action, resourceArn) {
    const role = this.roles.get(roleArn);
    if (!role) return false;

    for (const policy of role.permissionPolicies) {
      for (const stmt of policy.Statement || []) {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];

        const actionMatch = actions.some(a => matchArnPattern(a, action));
        const resourceMatch = resources.some(r => matchArnPattern(r, resourceArn));

        if (stmt.Effect === 'Allow' && actionMatch && resourceMatch) {
          return true;
        }
      }
    }

    return false;
  }

  getSecretValue(roleArn, secretArn, logSink = null) {
    const secret = this.secrets.get(secretArn);
    if (!secret) {
      const err = new Error(`ResourceNotFoundException: Secrets Manager can't find the specified secret ${secretArn}`);
      err.code = 'ResourceNotFoundException';
      throw err;
    }

    // 1. Evaluate Secrets Manager IAM permission
    const smAllowed = this.evaluatePermission(roleArn, 'secretsmanager:GetSecretValue', secretArn);
    if (!smAllowed) {
      const err = new Error(`AccessDeniedException: User ${roleArn} is not authorized to perform: secretsmanager:GetSecretValue on resource: ${secretArn}`);
      err.code = 'AccessDeniedException';
      throw err;
    }

    // 2. Evaluate KMS Key status and IAM permission
    const kmsKey = this.keys.get(secret.kmsKeyArn);
    if (!kmsKey) {
      const err = new Error(`NotFoundException: The request was rejected because the specified entity or resource could not be found: ${secret.kmsKeyArn}`);
      err.code = 'NotFoundException';
      throw err;
    }

    if (!kmsKey.enabled) {
      const err = new Error(`DisabledException: The request was rejected because the KMS key is not enabled: ${secret.kmsKeyArn}`);
      err.code = 'DisabledException';
      throw err;
    }

    const kmsAllowed = this.evaluatePermission(roleArn, 'kms:Decrypt', secret.kmsKeyArn);
    if (!kmsAllowed) {
      const err = new Error(`KMS.AccessDeniedException: The ciphertext refers to a customer master key that does not exist, does not exist in this region, or you are not allowed to access: ${secret.kmsKeyArn}`);
      err.code = 'KMS.AccessDeniedException';
      throw err;
    }

    // 3. Return decrypted secret, ensuring logger masks credentials
    if (logSink) {
      // Secure logging wrapper
      logSink.log(`Retrieved secret metadata for: ${secretArn} (Key: ${secret.kmsKeyArn}) [CONTENT REDACTED]`);
    }

    return secret.value;
  }
}

// -----------------------------------------------------------------------------
// Test Suite: Phase 7.2D.1
// -----------------------------------------------------------------------------
test('Phase 7.2D.1: Critical KMS IAM Remediation & Infrastructure Revalidation', async (t) => {
  const env = 'staging';
  const region = 'ap-south-1';
  const accountId = '123456789012';
  const oidcIssuer = 'https://oidc.eks.ap-south-1.amazonaws.com/id/TESTCLUSTER123456';

  const rdsKmsArn = `arn:aws:kms:${region}:${accountId}:key/rds-kms-1111-2222`;
  const storageKmsArn = `arn:aws:kms:${region}:${accountId}:key/storage-kms-3333-4444`;
  const unrelatedKmsArn = `arn:aws:kms:${region}:${accountId}:key/unrelated-kms-9999-0000`;

  const redisSecretArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:docsearch/${env}/redis/credentials-AbCdEf`;
  const rdsSecretArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:docsearch/${env}/database/credentials-GhIjKl`;
  const unrelatedSecretArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:docsearch/production/other-service/secret-MnOpQr`;
  const crossTenantSecretArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:docsearch-tenant-b/${env}/data-StUvWx`;

  const externalSecretsRoleArn = `arn:aws:iam:${accountId}:role/docsearch-${env}-external-secrets-role`;
  const unauthorizedRoleArn = `arn:aws:iam:${accountId}:role/docsearch-${env}-unauthorized-role`;

  // Read actual HCL policy from infra/eks_addons.tf
  const eksAddonsContent = fs.readFileSync(path.join(infraDir, 'eks_addons.tf'), 'utf8');
  const secretsManagerContent = fs.readFileSync(path.join(infraDir, 'secrets_manager.tf'), 'utf8');
  const kmsContent = fs.readFileSync(path.join(infraDir, 'kms.tf'), 'utf8');

  // Verify static HCL changes in eks_addons.tf
  await t.test('Static HCL Verification: Remediation Finding F-01', async (st) => {
    await st.test('S.1 eks_addons.tf grants KMS Decrypt on both RDS and Storage keys', () => {
      assert.match(eksAddonsContent, /aws_kms_key\.rds\.arn/, 'Must include RDS KMS key ARN');
      assert.match(eksAddonsContent, /aws_kms_key\.storage\.arn/, 'Must include Storage KMS key ARN');
      
      // Ensure no wildcards in KMS actions or resources
      assert.doesNotMatch(eksAddonsContent, /"kms:\*"/, 'Must not grant kms:*');
      assert.doesNotMatch(eksAddonsContent, /"Resource"\s*:\s*"\*"/, 'Must not use wildcard resource for KMS');
    });

    await st.test('S.2 eks_addons.tf IRSA trust policy permits both docsearch-app-sa and docsearch-api-gateway-sa', () => {
      assert.match(eksAddonsContent, /docsearch-production:docsearch-app-sa/, 'Must trust docsearch-app-sa');
      assert.match(eksAddonsContent, /docsearch-production:docsearch-api-gateway-sa/, 'Must trust docsearch-api-gateway-sa');
    });

    await st.test('S.3 secrets_manager.tf confirms Redis credentials are encrypted with storage KMS key', () => {
      assert.match(secretsManagerContent, /resource "aws_secretsmanager_secret" "redis_credentials"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.storage\.arn/,
        'Redis secret must use aws_kms_key.storage.arn');
    });
  });

  // Setup Mock AWS Simulator with Remediated Policy
  const engine = new MockAwsPolicyEngine();

  engine.registerKmsKey(rdsKmsArn, { enabled: true });
  engine.registerKmsKey(storageKmsArn, { enabled: true });
  engine.registerKmsKey(unrelatedKmsArn, { enabled: true });

  const mockRedisValue = JSON.stringify({
    host: 'staging-redis.docsearch.internal',
    port: 6379,
    auth_token: 'synthetic-staging-auth-token-12345',
    url: 'rediss://:synthetic-staging-auth-token-12345@staging-redis.docsearch.internal:6379'
  });

  const mockRdsValue = JSON.stringify({
    engine: 'postgres',
    host: 'staging-db.docsearch.internal',
    username: 'docsearch_admin',
    password: 'synthetic-staging-master-password-67890'
  });

  engine.registerSecret(redisSecretArn, { kmsKeyArn: storageKmsArn, value: mockRedisValue });
  engine.registerSecret(rdsSecretArn, { kmsKeyArn: rdsKmsArn, value: mockRdsValue });
  engine.registerSecret(unrelatedSecretArn, { kmsKeyArn: unrelatedKmsArn, value: 'unrelated-secret-data' });
  engine.registerSecret(crossTenantSecretArn, { kmsKeyArn: storageKmsArn, value: 'cross-tenant-secret-data' });

  // Remediated External Secrets IAM Policy
  const remediatedPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'SecretsManagerAccess',
        Effect: 'Allow',
        Action: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        Resource: [`arn:aws:secretsmanager:${region}:*:secret:docsearch/${env}/*`]
      },
      {
        Sid: 'KMSDecryptAccess',
        Effect: 'Allow',
        Action: ['kms:Decrypt', 'kms:DescribeKey'],
        Resource: [rdsKmsArn, storageKmsArn]
      }
    ]
  };

  const trustPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Federated: `arn:aws:iam::${accountId}:oidc-provider/${oidcIssuer.replace('https://', '')}` },
      Action: 'sts:AssumeRoleWithWebIdentity',
      Condition: {
        StringEquals: {
          [`${oidcIssuer.replace('https://', '')}:sub`]: [
            'system:serviceaccount:docsearch-production:docsearch-app-sa',
            'system:serviceaccount:docsearch-production:docsearch-api-gateway-sa'
          ],
          [`${oidcIssuer.replace('https://', '')}:aud`]: 'sts.amazonaws.com'
        }
      }
    }]
  };

  engine.registerRole(externalSecretsRoleArn, {
    trustPolicy,
    permissionPolicies: [remediatedPolicy]
  });

  engine.registerRole(unauthorizedRoleArn, {
    trustPolicy,
    permissionPolicies: [{
      Version: '2012-10-17',
      Statement: [{
        Sid: 'ReadOnlyLogs',
        Effect: 'Allow',
        Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        Resource: ['*']
      }]
    }]
  });

  // ---------------------------------------------------------------------------
  // 9 Required Security Regression Invariants
  // ---------------------------------------------------------------------------
  await t.test('Invariant 1: Redis secret can be decrypted by authorized staging role', () => {
    const secret = engine.getSecretValue(externalSecretsRoleArn, redisSecretArn);
    assert.ok(secret, 'Secret value must be returned');
    const parsed = JSON.parse(secret);
    assert.equal(parsed.host, 'staging-redis.docsearch.internal');
    assert.equal(parsed.auth_token, 'synthetic-staging-auth-token-12345');
  });

  await t.test('Invariant 2: Unauthorized role cannot decrypt Redis secret', () => {
    assert.throws(
      () => engine.getSecretValue(unauthorizedRoleArn, redisSecretArn),
      (err) => {
        assert.equal(err.code, 'AccessDeniedException');
        return true;
      },
      'Unauthorized role must be rejected with AccessDeniedException'
    );
  });

  await t.test('Invariant 3: RDS key access remains functional', () => {
    const secret = engine.getSecretValue(externalSecretsRoleArn, rdsSecretArn);
    assert.ok(secret, 'RDS Secret value must be returned');
    const parsed = JSON.parse(secret);
    assert.equal(parsed.engine, 'postgres');
    assert.equal(parsed.username, 'docsearch_admin');
  });

  await t.test('Invariant 4: Redis role cannot decrypt unrelated secrets', () => {
    assert.throws(
      () => engine.getSecretValue(externalSecretsRoleArn, unrelatedSecretArn),
      (err) => {
        assert.equal(err.code, 'AccessDeniedException');
        return true;
      },
      'Access to secrets outside docsearch/${environment}/* must be denied'
    );
  });

  await t.test('Invariant 5: Disabled or invalid KMS key fails safely', () => {
    const disabledKeyArn = `arn:aws:kms:${region}:${accountId}:key/disabled-storage-kms-key`;
    const disabledSecretArn = `arn:aws:secretsmanager:${region}:${accountId}:secret:docsearch/${env}/disabled/secret`;
    
    engine.registerKmsKey(disabledKeyArn, { enabled: false });
    engine.registerSecret(disabledSecretArn, { kmsKeyArn: disabledKeyArn, value: 'sensitive-data' });

    assert.throws(
      () => engine.getSecretValue(externalSecretsRoleArn, disabledSecretArn),
      (err) => {
        assert.equal(err.code, 'DisabledException');
        return true;
      },
      'Disabled KMS key must fail safely with DisabledException'
    );
  });

  await t.test('Invariant 6: Missing KMS permission produces an explicit error (F-01 Reproduction)', () => {
    // Policy omitting storage KMS key (pre-remediation F-01 defect)
    const defectivePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'SecretsManagerAccess',
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue'],
          Resource: [`arn:aws:secretsmanager:${region}:*:secret:docsearch/${env}/*`]
        },
        {
          Sid: 'KMSDecryptAccessDefective',
          Effect: 'Allow',
          Action: ['kms:Decrypt', 'kms:DescribeKey'],
          Resource: [rdsKmsArn] // storageKmsArn is missing!
        }
      ]
    };

    const defectiveRoleArn = `arn:aws:iam:${accountId}:role/docsearch-${env}-defective-role`;
    engine.registerRole(defectiveRoleArn, { trustPolicy, permissionPolicies: [defectivePolicy] });

    assert.throws(
      () => engine.getSecretValue(defectiveRoleArn, redisSecretArn),
      (err) => {
        assert.equal(err.code, 'KMS.AccessDeniedException');
        assert.match(err.message, /ciphertext refers to a customer master key/);
        return true;
      },
      'Missing storage KMS key must produce an explicit KMS.AccessDeniedException'
    );
  });

  await t.test('Invariant 7: Secret retrieval does not expose credentials in logs', () => {
    const logBuffer = [];
    const logger = {
      log: (msg) => logBuffer.push(msg)
    };

    const secret = engine.getSecretValue(externalSecretsRoleArn, redisSecretArn, logger);
    const logOutput = logBuffer.join('\n');

    assert.ok(logOutput.includes('Retrieved secret metadata'));
    assert.ok(logOutput.includes('[CONTENT REDACTED]'));
    assert.doesNotMatch(logOutput, /synthetic-staging-auth-token-12345/, 'Secret auth token must never appear in logs');
    assert.doesNotMatch(logOutput, /rediss:\/\//, 'Full Redis URI with credentials must never appear in logs');
  });

  await t.test('Invariant 8: Cross-tenant secrets remain inaccessible', () => {
    assert.throws(
      () => engine.getSecretValue(externalSecretsRoleArn, crossTenantSecretArn),
      (err) => {
        assert.equal(err.code, 'AccessDeniedException');
        return true;
      },
      'Cross-tenant secret docsearch-tenant-b must be blocked by resource ARN constraint'
    );
  });

  await t.test('Invariant 9: EKS service account cannot assume unauthorized IAM roles', () => {
    // 9.1 Authorized service accounts succeed
    const session1 = engine.assumeRoleWithWebIdentity(externalSecretsRoleArn, {
      oidcIssuer,
      tokenSub: 'system:serviceaccount:docsearch-production:docsearch-app-sa',
      tokenAud: 'sts.amazonaws.com'
    });
    assert.equal(session1.assumedRoleArn, externalSecretsRoleArn);

    const session2 = engine.assumeRoleWithWebIdentity(externalSecretsRoleArn, {
      oidcIssuer,
      tokenSub: 'system:serviceaccount:docsearch-production:docsearch-api-gateway-sa',
      tokenAud: 'sts.amazonaws.com'
    });
    assert.equal(session2.assumedRoleArn, externalSecretsRoleArn);

    // 9.2 Unauthorized service account in production namespace fails
    assert.throws(
      () => engine.assumeRoleWithWebIdentity(externalSecretsRoleArn, {
        oidcIssuer,
        tokenSub: 'system:serviceaccount:docsearch-production:unauthorized-sa',
        tokenAud: 'sts.amazonaws.com'
      }),
      (err) => {
        assert.equal(err.code, 'AccessDenied');
        return true;
      },
      'Unauthorized service account must fail assumeRoleWithWebIdentity'
    );

    // 9.3 Service account in wrong namespace fails
    assert.throws(
      () => engine.assumeRoleWithWebIdentity(externalSecretsRoleArn, {
        oidcIssuer,
        tokenSub: 'system:serviceaccount:default:docsearch-app-sa',
        tokenAud: 'sts.amazonaws.com'
      }),
      (err) => {
        assert.equal(err.code, 'AccessDenied');
        return true;
      },
      'Service account from wrong namespace must fail assumeRoleWithWebIdentity'
    );
  });
});
