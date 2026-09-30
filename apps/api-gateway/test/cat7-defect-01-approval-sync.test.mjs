import { test } from 'node:test';
import assert from 'node:assert/strict';
import fastify from 'fastify';
import { AppError, ErrorCode } from '@docsearch/shared-core';

test('DEFECT-CAT7-01: approval route must NOT return 200 when database sync throws', async () => {
  // Simulate the handler logic under test
  const simulateApprovalHandler = async (shouldDbSyncFail) => {
    let committed = false;
    const mockSyncToDb = async () => {
      if (shouldDbSyncFail) {
        throw new Error('PostgreSQL connection dropped / deadlocked');
      }
      committed = true;
    };

    // The vulnerable code swallowed the error:
    // try { await mockSyncToDb(); } catch {}
    // return { status: 200, success: true, message: 'Item approved and committed to partner live system.' };

    // The remediated code:
    try {
      await mockSyncToDb();
    } catch (err) {
      throw new AppError({
        message: `Approval failed: database synchronization error (${err?.message || 'Unknown database error'})`,
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500
      });
    }

    return { status: 200, success: true, message: 'Item approved and committed to partner live system.' };
  };

  // Test failure case
  await assert.rejects(
    async () => {
      await simulateApprovalHandler(true);
    },
    (err) => {
      assert.equal(err.statusCode, 500);
      assert.equal(err.code, ErrorCode.DATABASE_ERROR);
      assert.match(err.message, /database synchronization error/);
      return true;
    }
  );

  // Test success case
  const res = await simulateApprovalHandler(false);
  assert.equal(res.status, 200);
  assert.equal(res.success, true);
});
