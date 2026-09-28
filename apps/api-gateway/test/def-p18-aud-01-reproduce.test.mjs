import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../dist/app.js';
import { getDatabase } from '@docsearch/database';
import { auditRepository } from '../dist/repositories/core/AuditRepository.js';

describe('DEF-P18-AUD-01: AuditRepository branch validation reproduction', () => {
  let app;
  const tenantA = '11111111-1111-4111-8111-111111111111';
  const tenantB = '22222222-2222-4222-8222-222222222222';
  const validBranchA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const nonExistentBranch = '99999999-9999-4999-8999-999999999999';

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('Case A: Explicit valid branch -> SUCCESS', async () => {
    const res = await auditRepository.recordEvent(
      {
        eventType: 'TEST_EVENT',
        resourceType: 'TEST_RESOURCE',
        resourceId: 'res-1'
      },
      {
        userId: 'usr-1',
        tenantId: tenantA,
        branchId: validBranchA
      }
    );
    assert.ok(res);
    assert.equal(res.tenantId, tenantA);
    assert.equal(res.branchId, validBranchA);
  });

  it('Case B: Explicit invalid branch in session -> MUST FAIL with 404', async () => {
    try {
      const res = await auditRepository.recordEvent(
        {
          eventType: 'TEST_EVENT',
          resourceType: 'TEST_RESOURCE',
          resourceId: 'res-2'
        },
        {
          userId: 'usr-1',
          tenantId: tenantA,
          branchId: nonExistentBranch
        }
      );
      // If it returns successfully, it silently substituted the branch!
      console.log('UNEXPECTED SUCCESS (DEF-P18-AUD-01 Confirmed): substituted branchId =', res.branchId);
      assert.fail(`Expected 404 NOT_FOUND, but audit event was recorded with substituted branch: ${res.branchId}`);
    } catch (err) {
      console.log('Case B error caught:', err.statusCode, err.message);
      assert.equal(err.statusCode, 404);
    }
  });

  it('Case C: Explicit cross-tenant branch -> MUST FAIL with 403', async () => {
    try {
      await auditRepository.recordEvent(
        {
          eventType: 'TEST_EVENT',
          resourceType: 'TEST_RESOURCE',
          resourceId: 'res-3'
        },
        {
          userId: 'usr-1',
          tenantId: tenantB,
          branchId: validBranchA // validBranchA belongs to tenantA
        }
      );
      assert.fail('Expected 403 FORBIDDEN');
    } catch (err) {
      console.log('Case C error caught:', err.statusCode, err.message);
      assert.equal(err.statusCode, 403);
    }
  });

  it('Case D: Branch omitted -> documented fallback behavior only', async () => {
    const res = await auditRepository.recordEvent(
      {
        eventType: 'TEST_EVENT',
        resourceType: 'TEST_RESOURCE',
        resourceId: 'res-4'
      },
      {
        userId: 'usr-1',
        tenantId: tenantA
        // branchId omitted
      }
    );
    assert.ok(res);
    assert.equal(res.tenantId, tenantA);
    console.log('Case D result: branchId =', res.branchId);
  });
});
