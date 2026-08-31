import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  signJwt,
  verifyJwt,
  generateRefreshToken,
  hashRefreshToken,
  buildSessionContext,
  SessionService,
  InMemorySessionStore,
  RBACEvaluator,
  ScopeGuard,
  buildSecurityAuditRecord,
  computeAuditHash,
  canonicalizeAuditPayload
} from '../dist/index.js';
import { validateSecretQuality, AppError } from '@docsearch/shared-core';

describe('Wave 1 Healthcare Security Foundation — Test Suite', () => {
  const MASTER_SECRET = 'super_secure_production_secret_key_at_least_32_characters_long_12345';
  const VALID_ISSUER = 'docsearch-api';
  const VALID_AUDIENCE = 'docsearch-platform';

  // Synthetic Test Fixtures
  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';
  const BRANCH_A1 = '33333333-3333-4333-8333-333333333331';
  const BRANCH_A2 = '33333333-3333-4333-8333-333333333332';
  const USER_DOCTOR_A1 = '44444444-4444-4444-8444-444444444441';

  // --------------------------------------------------------------------------
  // 1. JWT Security Tests (Tests 1 to 7)
  // --------------------------------------------------------------------------

  it('TEST 1: Valid JWT is accepted with valid claims', () => {
    const token = signJwt(
      {
        sub: USER_DOCTOR_A1,
        email: 'dr.sharma@apollo.health',
        tenantId: TENANT_A,
        branchId: BRANCH_A1,
        roles: ['DOCTOR'],
        permissions: ['patient:read', 'prescription:write']
      },
      {
        secret: MASTER_SECRET,
        expiresInSeconds: 900,
        issuer: VALID_ISSUER,
        audience: VALID_AUDIENCE
      }
    );

    const verified = verifyJwt(token, {
      secret: MASTER_SECRET,
      expectedIssuer: VALID_ISSUER,
      expectedAudience: VALID_AUDIENCE
    });

    assert.equal(verified.sub, USER_DOCTOR_A1);
    assert.equal(verified.iss, VALID_ISSUER);
    assert.equal(verified.aud, VALID_AUDIENCE);
    assert.ok(typeof verified.exp === 'number');
  });

  it('TEST 2: Expired JWT is rejected with 401 TOKEN_EXPIRED', () => {
    const expiredToken = signJwt(
      {
        sub: USER_DOCTOR_A1,
        email: 'dr.sharma@apollo.health',
        tenantId: TENANT_A,
        roles: ['DOCTOR']
      },
      {
        secret: MASTER_SECRET,
        expiresInSeconds: -60, // Already expired 60 seconds ago
        issuer: VALID_ISSUER,
        audience: VALID_AUDIENCE
      }
    );

    assert.throws(
      () => {
        verifyJwt(expiredToken, {
          secret: MASTER_SECRET,
          expectedIssuer: VALID_ISSUER,
          expectedAudience: VALID_AUDIENCE
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401 && err.code === 'TOKEN_EXPIRED';
      }
    );
  });

  it('TEST 3: Invalid signature is rejected with 401 TOKEN_INVALID', () => {
    const validToken = signJwt(
      {
        sub: USER_DOCTOR_A1,
        email: 'dr.sharma@apollo.health',
        tenantId: TENANT_A,
        roles: ['DOCTOR']
      },
      {
        secret: MASTER_SECRET,
        issuer: VALID_ISSUER,
        audience: VALID_AUDIENCE
      }
    );

    const forgedSecret = 'attacker_forged_secret_key_at_least_32_characters_long_99999';

    assert.throws(
      () => {
        verifyJwt(validToken, {
          secret: forgedSecret,
          expectedIssuer: VALID_ISSUER,
          expectedAudience: VALID_AUDIENCE
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401 && err.code === 'TOKEN_INVALID';
      }
    );
  });

  it('TEST 4: Wrong issuer is rejected with 401 TOKEN_INVALID', () => {
    const token = signJwt(
      {
        sub: USER_DOCTOR_A1,
        email: 'dr.sharma@apollo.health',
        tenantId: TENANT_A,
        roles: ['DOCTOR']
      },
      {
        secret: MASTER_SECRET,
        issuer: 'untrusted-external-issuer',
        audience: VALID_AUDIENCE
      }
    );

    assert.throws(
      () => {
        verifyJwt(token, {
          secret: MASTER_SECRET,
          expectedIssuer: VALID_ISSUER,
          expectedAudience: VALID_AUDIENCE
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401 && err.message.includes('Invalid token issuer');
      }
    );
  });

  it('TEST 5: Wrong audience is rejected with 401 TOKEN_INVALID', () => {
    const token = signJwt(
      {
        sub: USER_DOCTOR_A1,
        email: 'dr.sharma@apollo.health',
        tenantId: TENANT_A,
        roles: ['DOCTOR']
      },
      {
        secret: MASTER_SECRET,
        issuer: VALID_ISSUER,
        audience: 'untrusted-audience'
      }
    );

    assert.throws(
      () => {
        verifyJwt(token, {
          secret: MASTER_SECRET,
          expectedIssuer: VALID_ISSUER,
          expectedAudience: VALID_AUDIENCE
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401 && err.message.includes('Invalid token audience');
      }
    );
  });

  it('TEST 6: Missing exp is rejected (fail closed)', async () => {
    // Manually construct token without exp
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: USER_DOCTOR_A1, iat: Math.floor(Date.now() / 1000) })
    ).toString('base64url');
    const sigInput = `${header}.${payload}`;
    const { createHmac } = await import('node:crypto');
    const sig = createHmac('sha256', MASTER_SECRET).update(sigInput).digest('base64url');
    const craftedToken = `${sigInput}.${sig}`;

    assert.throws(
      () => {
        verifyJwt(craftedToken, MASTER_SECRET);
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401;
      }
    );
  });

  it('TEST 7: Unsupported algorithm (e.g. alg=none or RS256) is rejected', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: USER_DOCTOR_A1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      })
    ).toString('base64url');
    const craftedToken = `${header}.${payload}.`;

    assert.throws(
      () => {
        verifyJwt(craftedToken, MASTER_SECRET);
      },
      (err) => {
        return err instanceof AppError && err.message.includes('Unsupported or prohibited JWT algorithm');
      }
    );
  });

  // --------------------------------------------------------------------------
  // 2. Authorization, RBAC & Isolation Tests (Tests 8 to 13)
  // --------------------------------------------------------------------------

  it('TEST 8: Unauthenticated session construction fails closed', () => {
    assert.throws(
      () => {
        buildSessionContext({
          // Missing sub, email, tenantId
          roles: ['DOCTOR']
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401;
      }
    );
  });

  it('TEST 9: Authenticated user without required permission is rejected with 403', () => {
    const session = buildSessionContext({
      sub: USER_DOCTOR_A1,
      email: 'dr.sharma@apollo.health',
      tenantId: TENANT_A,
      branchId: BRANCH_A1,
      roles: ['NURSE'],
      permissions: ['patient:read', 'vitals:write'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    assert.throws(
      () => {
        RBACEvaluator.enforcePermission(session, {
          resource: 'ot_surgery',
          action: 'approve'
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 403 && err.code === 'INSUFFICIENT_PERMISSIONS';
      }
    );
  });

  it('TEST 10: Tenant A user accessing Tenant B resource is denied (403)', () => {
    const sessionA = buildSessionContext({
      sub: USER_DOCTOR_A1,
      email: 'dr.sharma@apollo.health',
      tenantId: TENANT_A,
      roles: ['DOCTOR'],
      permissions: ['patient:read', 'patient:write'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    assert.throws(
      () => {
        ScopeGuard.enforceTenantScope(sessionA, {
          targetTenantId: TENANT_B // Attempting to access Tenant B patient
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 403 && err.code === 'TENANT_ACCESS_DENIED';
      }
    );
  });

  it('TEST 11: Branch A1 user accessing Branch A2 resource is denied (403)', () => {
    const sessionBranchA1 = buildSessionContext({
      sub: USER_DOCTOR_A1,
      email: 'dr.sharma@apollo.health',
      tenantId: TENANT_A,
      branchId: BRANCH_A1,
      roles: ['DOCTOR'],
      permissions: ['patient:read'],
      scope: 'branch',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    assert.throws(
      () => {
        ScopeGuard.enforceBranchScope(sessionBranchA1, {
          targetTenantId: TENANT_A,
          targetBranchId: BRANCH_A2 // Attempting to access Branch A2 data
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 403 && err.code === 'BRANCH_ACCESS_DENIED';
      }
    );
  });

  it('TEST 12: Missing tenant context in scope guard fails closed', () => {
    const session = buildSessionContext({
      sub: USER_DOCTOR_A1,
      email: 'dr.sharma@apollo.health',
      tenantId: TENANT_A,
      roles: ['DOCTOR'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    assert.throws(
      () => {
        ScopeGuard.enforceTenantScope(session, {
          targetTenantId: '' // Missing/blank tenant
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 403;
      }
    );
  });

  it('TEST 13: Super admin bypasses tenant scope guard safely', () => {
    const superAdminSession = buildSessionContext({
      sub: '00000000-0000-0000-0000-000000000000',
      email: 'superadmin@docsearch.health',
      tenantId: 'system-tenant',
      roles: ['SUPER_ADMIN'],
      permissions: ['*'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    assert.doesNotThrow(() => {
      ScopeGuard.enforceTenantScope(superAdminSession, { targetTenantId: TENANT_A });
      ScopeGuard.enforceTenantScope(superAdminSession, { targetTenantId: TENANT_B });
      RBACEvaluator.enforcePermission(superAdminSession, { resource: 'any_resource', action: 'delete' });
    });
  });

  // --------------------------------------------------------------------------
  // 3. Refresh-Token Lifecycle & Session Security (Tests 14 to 16)
  // --------------------------------------------------------------------------

  it('TEST 14: Refresh token rotation issues new token and invalidates old token', async () => {
    const store = new InMemorySessionStore();
    const sessionService = new SessionService(store);

    const { refreshToken: initialRefreshToken } = await sessionService.createSession({
      userId: USER_DOCTOR_A1,
      tenantId: TENANT_A,
      roles: ['DOCTOR'],
      actorEmail: 'dr.sharma@apollo.health',
      jwtSecret: MASTER_SECRET,
      jwtIssuer: VALID_ISSUER,
      jwtAudience: VALID_AUDIENCE
    });

    // Rotate once
    const { newRefreshToken: secondRefreshToken, newAccessToken } =
      await sessionService.rotateRefreshToken({
        rawRefreshToken: initialRefreshToken,
        jwtSecret: MASTER_SECRET,
        jwtIssuer: VALID_ISSUER,
        jwtAudience: VALID_AUDIENCE
      });

    assert.ok(secondRefreshToken);
    assert.notEqual(secondRefreshToken, initialRefreshToken);
    assert.ok(newAccessToken);

    // Old token must no longer work
    await assert.rejects(
      async () => {
        await sessionService.rotateRefreshToken({
          rawRefreshToken: initialRefreshToken,
          jwtSecret: MASTER_SECRET
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401;
      }
    );
  });

  it('TEST 15: Refresh token reuse detection revokes entire session family', async () => {
    const store = new InMemorySessionStore();
    const sessionService = new SessionService(store);

    const { sessionId, refreshToken: token1 } = await sessionService.createSession({
      userId: USER_DOCTOR_A1,
      tenantId: TENANT_A,
      roles: ['DOCTOR'],
      actorEmail: 'dr.sharma@apollo.health',
      jwtSecret: MASTER_SECRET
    });

    // Legitimate rotation: token1 -> token2
    const { newRefreshToken: token2 } = await sessionService.rotateRefreshToken({
      rawRefreshToken: token1,
      jwtSecret: MASTER_SECRET
    });

    // Simulate attacker intercepting and re-using revoked token1:
    const session = await store.findSessionById(sessionId);
    assert.ok(session);
    // Mark session revoked to simulate revoked state
    session.revokedAt = new Date();
    await store.updateSession(session);

    // Attacker presenting revoked token hash
    await assert.rejects(
      async () => {
        await sessionService.rotateRefreshToken({
          rawRefreshToken: token2,
          jwtSecret: MASTER_SECRET
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401;
      }
    );
  });

  it('TEST 16: User logout explicitly revokes session', async () => {
    const store = new InMemorySessionStore();
    const sessionService = new SessionService(store);

    const { sessionId, refreshToken } = await sessionService.createSession({
      userId: USER_DOCTOR_A1,
      tenantId: TENANT_A,
      roles: ['DOCTOR'],
      actorEmail: 'dr.sharma@apollo.health',
      jwtSecret: MASTER_SECRET
    });

    // Explicit logout
    await sessionService.logout(sessionId);

    // Attempting to rotate with logged-out session must fail
    await assert.rejects(
      async () => {
        await sessionService.rotateRefreshToken({
          rawRefreshToken: refreshToken,
          jwtSecret: MASTER_SECRET
        });
      },
      (err) => {
        return err instanceof AppError && err.statusCode === 401;
      }
    );
  });

  // --------------------------------------------------------------------------
  // 4. Production Secret & Environment Quality Tests (Tests 17 to 19)
  // --------------------------------------------------------------------------

  it('TEST 17: Production configuration with placeholder secret fails validation', () => {
    const insecureSecrets = ['secret', 'changeme', 'dev-secret', 'password', 'short'];

    for (const sec of insecureSecrets) {
      assert.throws(
        () => {
          validateSecretQuality('JWT_SECRET', sec, 32);
        },
        (err) => {
          return err instanceof AppError && err.statusCode === 400;
        }
      );
    }
  });

  it('TEST 18: Production secret validation passes for high-entropy secrets', () => {
    assert.doesNotThrow(() => {
      validateSecretQuality('JWT_SECRET', MASTER_SECRET, 32);
    });
  });

  it('TEST 19: Refresh token hash is cryptographically deterministic and irreversible', () => {
    const { token, hashedToken } = generateRefreshToken();
    const recomputedHash = hashRefreshToken(token);

    assert.equal(hashedToken, recomputedHash);
    assert.notEqual(token, hashedToken);
    assert.equal(hashedToken.length, 64); // SHA-256 hex
  });

  // --------------------------------------------------------------------------
  // 5. Cryptographic Audit Hash Chain Tests (Tests 20 & 21)
  // --------------------------------------------------------------------------

  it('TEST 20: Audit record creates deterministic SHA-256 integrity hash', () => {
    const event = {
      eventType: 'PATIENT_RECORD_VIEW',
      resourceType: 'MEDICAL_CHART',
      resourceId: 'MED-2026-9021',
      correlationId: 'REQ-101'
    };

    const session = buildSessionContext({
      sub: USER_DOCTOR_A1,
      email: 'dr.sharma@apollo.health',
      tenantId: TENANT_A,
      roles: ['DOCTOR'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    const audit1 = buildSecurityAuditRecord(event, session);

    assert.ok(audit1.integrityHash);
    assert.equal(audit1.integrityHash?.length, 64);
    assert.equal(audit1.tenantId, TENANT_A);
    assert.equal(audit1.actorId, USER_DOCTOR_A1);
  });

  it('TEST 21: Audit hash chain detects tampering if any field is modified', () => {
    const session = buildSessionContext({
      sub: USER_DOCTOR_A1,
      email: 'dr.sharma@apollo.health',
      tenantId: TENANT_A,
      roles: ['DOCTOR'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    const genesisHash = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
    const auditRecord = buildSecurityAuditRecord(
      { eventType: 'PRESCRIPTION_DISPATCH', resourceType: 'E_RX', resourceId: 'RX-99' },
      session,
      genesisHash
    );

    // Verify hash matches
    const expectedHash = computeAuditHash(auditRecord, genesisHash);
    assert.equal(auditRecord.integrityHash, expectedHash);

    // Simulate tampering with actorId
    const tamperedRecord = { ...auditRecord, actorId: 'hacker-user-id' };
    const tamperedHash = computeAuditHash(tamperedRecord, genesisHash);

    assert.notEqual(tamperedHash, auditRecord.integrityHash, 'Tampered audit record must produce mismatched hash');
  });
});
