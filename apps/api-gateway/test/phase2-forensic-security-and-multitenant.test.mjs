import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { realAuthService } from '../dist/services/core/RealAuthService.js';
import { signJwt, verifyJwt } from '@docsearch/auth';

describe('Phase 2 Forensic Verification: Security, Auth & Multi-Tenant Isolation', () => {
  const jwtSecret = 'test-jwt-secret-phase2-forensic-verification-key-2026';
  const issuer = 'docsearch-test-issuer';
  const audience = 'docsearch-test-audience';

  test('1. Founder Authentication Hardening: Rejects weak/alternate backdoors', async () => {
    // Standard provisioned credential must authenticate
    const founderUser1 = await realAuthService.authenticateUser('founder@docsearch.health', 'FounderPass123!');
    assert.ok(founderUser1, 'Founder must authenticate with provisioned credential');
    assert.equal(founderUser1.email, 'founder@docsearch.health');
    assert.ok(founderUser1.roles.includes('SUPER_ADMIN'), 'Founder must have SUPER_ADMIN role');

    // Weak alternate/backdoor passwords must fail closed (return null)
    const backdoor1 = await realAuthService.authenticateUser('founder@docsearch.health', 'DocSearch@2026!');
    assert.equal(backdoor1, null, 'Weak backdoor DocSearch@2026! must be rejected');

    const backdoor2 = await realAuthService.authenticateUser('founder@docsearch.health', 'admin123');
    assert.equal(backdoor2, null, 'Weak backdoor admin123 must be rejected');

    const backdoor3 = await realAuthService.authenticateUser('founder@docsearch.health', '123456');
    assert.equal(backdoor3, null, 'Weak backdoor 123456 must be rejected');

    // Wrong password must fail closed
    const invalidAuth = await realAuthService.authenticateUser('founder@docsearch.health', 'WrongPassword999!');
    assert.equal(invalidAuth, null, 'Invalid password must return null');
  });

  test('2. Multi-Tenant Token Role Isolation (Tenant A vs Tenant B)', async () => {
    // Generate valid token for Hospital A
    const tokenHospitalA = signJwt(
      {
        sub: 'user-hosp-a-1111',
        actorEmail: 'doctor@hospital-a.health',
        tenantId: '11111111-1111-4111-8111-111111111111',
        organizationId: 'org-hosp-a',
        branchId: 'branch-hosp-a',
        roles: ['DOCTOR'],
        permissions: ['clinical:patients:read', 'prescriptions:write']
      },
      {
        secret: jwtSecret,
        issuer,
        audience,
        expiresInSeconds: 3600
      }
    );

    // Generate valid token for Hospital B
    const tokenHospitalB = signJwt(
      {
        sub: 'user-hosp-b-2222',
        actorEmail: 'doctor@hospital-b.health',
        tenantId: '22222222-2222-4222-8222-222222222222',
        organizationId: 'org-hosp-b',
        branchId: 'branch-hosp-b',
        roles: ['DOCTOR'],
        permissions: ['clinical:patients:read', 'prescriptions:write']
      },
      {
        secret: jwtSecret,
        issuer,
        audience,
        expiresInSeconds: 3600
      }
    );

    assert.ok(tokenHospitalA, 'Token for Hospital A should be generated');
    assert.ok(tokenHospitalB, 'Token for Hospital B should be generated');
    assert.notEqual(tokenHospitalA, tokenHospitalB, 'Tokens for different hospitals must differ');

    const claimsA = verifyJwt(tokenHospitalA, { secret: jwtSecret, expectedIssuer: issuer, expectedAudience: audience });
    const claimsB = verifyJwt(tokenHospitalB, { secret: jwtSecret, expectedIssuer: issuer, expectedAudience: audience });

    assert.equal(claimsA.tenantId, '11111111-1111-4111-8111-111111111111', 'Hospital A token must preserve Tenant A');
    assert.equal(claimsB.tenantId, '22222222-2222-4222-8222-222222222222', 'Hospital B token must preserve Tenant B');
    assert.notEqual(claimsA.tenantId, claimsB.tenantId, 'Tenant IDs must not bleed');
  });

  test('3. RBAC Strict Boundary: Doctor cannot access Central SaaS GodMode/Founder endpoints', async () => {
    const doctorUser = await realAuthService.authenticateUser('doctor@docsearch.health', 'DoctorPass123!');
    assert.ok(doctorUser, 'Doctor user must authenticate');
    assert.ok(!doctorUser.roles.includes('SUPER_ADMIN'), 'Doctor must NOT possess SUPER_ADMIN role');
    assert.ok(!doctorUser.permissions.includes('*'), 'Doctor must NOT possess wildcard permissions');
  });

  test('4. UUID Validation Guard: Non-hex strings are rejected', async () => {
    const { isValidUuid } = await import('../dist/utils/uuid-guard.js');
    assert.equal(isValidUuid('aaaa1111-8492-4aaa-8aaa-849208492000'), true, 'Valid RFC UUID must pass');
    assert.equal(isValidUuid('nnnn4444-8492-4nnn-8nnn-849208492004'), false, 'UUID with non-hex n must fail');
    assert.equal(isValidUuid('custom-partner-id-123'), false, 'Arbitrary text must fail');
    assert.equal(isValidUuid(null), false, 'Null must fail');
    assert.equal(isValidUuid(undefined), false, 'Undefined must fail');
  });
});
